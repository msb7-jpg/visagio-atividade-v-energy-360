"""Orquestra a visão de Continuidade: períodos A/B, evento extremo e filtro de escopo."""

from app.features.grid_quality.continuity_repository import ContinuityRepository
from app.features.grid_quality.continuity_rules import (
    MonthlyFeederRow,
    build_cause_shares,
    build_event,
    build_feeders,
    build_kpis,
    build_municipalities,
    build_type_shares,
    detect_event,
    split_periods,
    sum_rows,
)
from app.features.grid_quality.continuity_schemas import AffectedCustomerDTO, ContinuityEventDTO, ContinuitySnapshotDTO
from app.features.grid_quality.municipalities import MUNICIPALITY_REFERENCES, normalize_municipality
from app.shared.exceptions import BadRequestException

MESES_CLIENTES_MINIMO = 1
MESES_CLIENTES_PADRAO = 12
MESES_CLIENTES_MAXIMO = 48
LIMITE_CLIENTES_MINIMO = 1
LIMITE_CLIENTES_PADRAO = 10
LIMITE_CLIENTES_MAXIMO = 50


def _resolve_municipality(municipio: str | None) -> str | None:
    if not municipio:
        return None
    municipality_key = normalize_municipality(municipio)
    if municipality_key not in MUNICIPALITY_REFERENCES:
        raise BadRequestException(f"Município '{municipio}' desconhecido.")
    return municipality_key


def _rows_in(rows: list[MonthlyFeederRow], months: list[str], skipped: set[str]) -> list[MonthlyFeederRow]:
    return [row for row in rows if row.competencia in months and row.competencia not in skipped]


def _event_card(
    event_competencia: str | None, scope_rows: list[MonthlyFeederRow], period_b: list[str], scope_ucs: int
) -> ContinuityEventDTO | None:
    if event_competencia is None:
        return None
    period_b_without_event = sum_rows(_rows_in(scope_rows, period_b, {event_competencia}))
    return build_event(event_competencia, scope_rows, period_b_without_event, scope_ucs)


class ContinuityService:
    """Monta o `ContinuitySnapshot` a partir de agregações SQL pequenas (nunca carrega as 180 mil ocorrências)."""

    def __init__(self, repository: ContinuityRepository) -> None:
        self.repository = repository

    async def get_snapshot(self, municipio: str | None = None, incluir_evento: bool = True) -> ContinuitySnapshotDTO:
        """Compara o período B (últimos 12 meses) contra o A (primeiros 12) no escopo informado.

        O evento extremo é detectado na rede inteira, igual para qualquer município; os números do cartão
        e dos blocos são os do escopo. Sem `incluir_evento`, o mês do evento sai de A e de B.

        Args:
            municipio: Nome do município (com ou sem acento); vazio traz a rede inteira.
            incluir_evento: Se falso, remove o mês do evento dos agregados.

        Returns:
            Snapshot de Continuidade; `event` é nulo quando nenhum mês passa do limiar.

        Raises:
            BadRequestException: Se o município não é conhecido.
            DatabaseReadError: Se as tabelas Gold estiverem ausentes ou fora do contrato.
        """
        municipality_key = _resolve_municipality(municipio)
        all_rows = await self.repository.fetch_monthly()
        ucs_by_feeder = await self.repository.fetch_feeder_ucs()
        municipality_by_feeder = await self.repository.fetch_scope(municipality_key)

        event_competencia = detect_event(all_rows)
        excluded = {event_competencia} if event_competencia and not incluir_evento else set()
        period_a, period_b = split_periods(row.competencia for row in all_rows)
        scope_rows = [row for row in all_rows if row.id_alimentador in municipality_by_feeder]
        scope_ucs = sum(ucs_by_feeder.get(feeder_id, 0) for feeder_id in municipality_by_feeder)
        current_rows = _rows_in(scope_rows, period_b, excluded)
        previous_rows = _rows_in(scope_rows, period_a, excluded)

        months_b = [month for month in period_b if month not in excluded]
        feeder_ids = list(municipality_by_feeder)
        return ContinuitySnapshotDTO(
            kpis=build_kpis(sum_rows(current_rows), sum_rows(previous_rows), scope_ucs),
            event=_event_card(event_competencia, scope_rows, period_b, scope_ucs),
            municipalities=build_municipalities(current_rows, ucs_by_feeder, municipality_by_feeder),
            feeders=build_feeders(current_rows, previous_rows, ucs_by_feeder, municipality_by_feeder),
            causes=build_cause_shares(await self.repository.fetch_cause_hours(months_b, feeder_ids)),
            types=build_type_shares(await self.repository.fetch_type_counts(months_b, feeder_ids)),
        )

    async def get_affected_customers(
        self, id_alimentador: str, meses: int = MESES_CLIENTES_PADRAO, limite: int = LIMITE_CLIENTES_PADRAO
    ) -> list[AffectedCustomerDTO]:
        """Ranking das UCs de um alimentador por horas sem energia nos últimos meses da série.

        Args:
            id_alimentador: Identificador do alimentador.
            meses: Janela, em meses, contada a partir da competência mais recente da série.
            limite: Quantidade máxima de UCs.

        Returns:
            UCs com mais horas sem energia primeiro; lista vazia se o alimentador não tem ocorrências na janela.
        """
        competencias = await self.repository.fetch_latest_competencias(meses)
        return await self.repository.fetch_affected_customers(id_alimentador, competencias, limite)
