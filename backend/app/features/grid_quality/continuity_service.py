"""Orquestra a visão de Continuidade: períodos A/B, evento extremo e filtro de escopo."""

from app.features.grid_quality.continuity_repository import ContinuityRepository
from app.features.grid_quality.continuity_rules import (
    CAUSA_NAO_INFORMADA,
    SEM_CAUSA_REGISTRADA,
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
from app.features.grid_quality.continuity_schemas import (
    AffectedCustomerDTO,
    CauseShareDTO,
    ContinuityEventDTO,
    ContinuityPeriodsDTO,
    ContinuitySnapshotDTO,
    PeriodRangeDTO,
    TypeShareDTO,
)
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


def _split_scope(
    series: list[str], scope_rows: list[MonthlyFeederRow], excluded: set[str]
) -> tuple[list[MonthlyFeederRow], list[MonthlyFeederRow], list[str]]:
    period_a, period_b = split_periods(series)
    months_b = [month for month in period_b if month not in excluded]
    return _rows_in(scope_rows, period_b, excluded), _rows_in(scope_rows, period_a, excluded), months_b


def _event_card(
    event_competencia: str | None, series: list[str], scope_rows: list[MonthlyFeederRow], scope_ucs: int
) -> ContinuityEventDTO | None:
    if event_competencia is None:
        return None
    period_b = split_periods(series)[1]
    period_b_without_event = sum_rows(_rows_in(scope_rows, period_b, {event_competencia}))
    return build_event(event_competencia, series, scope_rows, period_b_without_event, scope_ucs)


def _period_ranges(series: list[str]) -> ContinuityPeriodsDTO:
    period_a, period_b = split_periods(series)
    return ContinuityPeriodsDTO(
        previous=PeriodRangeDTO(start=period_a[0], end=period_a[-1]),
        current=PeriodRangeDTO(start=period_b[0], end=period_b[-1]),
    )


class ContinuityService:
    """Monta o `ContinuitySnapshot` a partir de agregações SQL pequenas (nunca carrega as 180 mil ocorrências)."""

    def __init__(self, repository: ContinuityRepository) -> None:
        self.repository = repository

    async def _resolve_cause(self, causa: str | None) -> str | None:
        if not causa:
            return None
        cause_key = CAUSA_NAO_INFORMADA if causa == SEM_CAUSA_REGISTRADA else causa
        if cause_key not in await self.repository.fetch_causes():
            raise BadRequestException(f"Causa '{causa}' desconhecida.")
        return cause_key

    async def get_snapshot(
        self, municipio: str | None = None, incluir_evento: bool = True, causa: str | None = None
    ) -> ContinuitySnapshotDTO:
        """Compara o período B (últimos 12 meses) contra o A (primeiros 12) no escopo informado.

        O evento extremo é detectado na rede inteira, igual para qualquer município; os números do cartão
        e dos blocos são os do escopo. Sem `incluir_evento`, o mês do evento sai de A e de B.
        A causa filtra as ocorrências (KPIs, evento, municípios, circuitos e tipos); o denominador do DEC/FEC
        e o bloco de causas não mudam com ela.

        Args:
            municipio: Nome do município (com ou sem acento); vazio traz a rede inteira.
            incluir_evento: Se falso, remove o mês do evento dos agregados.
            causa: Causa como está no banco ('Sem causa registrada' vale NAO INFORMADA); vazio não filtra.

        Returns:
            Snapshot de Continuidade; `event` é nulo quando nenhum mês passa do limiar.

        Raises:
            BadRequestException: Se o município ou a causa não é conhecido.
            DatabaseReadError: Se as tabelas Gold estiverem ausentes ou fora do contrato.
        """
        cause_key = await self._resolve_cause(causa)
        all_rows = await self.repository.fetch_monthly()
        scope_rows, ucs_by_feeder, municipality_by_feeder = await self._load_scope(
            all_rows, municipio, cause_key
        )

        event_competencia = detect_event(all_rows)
        excluded = {event_competencia} if event_competencia and not incluir_evento else set()
        series = sorted({row.competencia for row in all_rows})
        scope_ucs = sum(ucs_by_feeder.get(feeder_id, 0) for feeder_id in municipality_by_feeder)
        current_rows, previous_rows, months_b = _split_scope(series, scope_rows, excluded)

        causes, types = await self._distributions(months_b, list(municipality_by_feeder), cause_key)
        return ContinuitySnapshotDTO(
            periods=_period_ranges(series),
            kpis=build_kpis(sum_rows(current_rows), sum_rows(previous_rows), scope_ucs),
            event=_event_card(event_competencia, series, scope_rows, scope_ucs),
            municipalities=build_municipalities(current_rows, ucs_by_feeder, municipality_by_feeder),
            feeders=build_feeders(current_rows, previous_rows, ucs_by_feeder, municipality_by_feeder),
            causes=causes,
            types=types,
        )

    async def _load_scope(
        self, all_rows: list[MonthlyFeederRow], municipio: str | None, cause_key: str | None
    ) -> tuple[list[MonthlyFeederRow], dict[str, int], dict[str, str]]:
        # O evento sai de `all_rows` (rede inteira, sem causa); o escopo usa as linhas da causa, se houver.
        municipality_key = _resolve_municipality(municipio)
        cause_rows = all_rows if cause_key is None else await self.repository.fetch_monthly(cause_key)
        ucs_by_feeder = await self.repository.fetch_feeder_ucs()
        municipality_by_feeder = await self.repository.fetch_scope(municipality_key)
        scope_rows = [row for row in cause_rows if row.id_alimentador in municipality_by_feeder]
        return scope_rows, ucs_by_feeder, municipality_by_feeder

    async def _distributions(
        self, months: list[str], feeder_ids: list[str], cause_key: str | None
    ) -> tuple[list[CauseShareDTO], list[TypeShareDTO]]:
        # Causas mostram todas (para comparar e escolher); só os tipos respeitam a causa filtrada.
        causes = build_cause_shares(await self.repository.fetch_cause_hours(months, feeder_ids))
        types = build_type_shares(await self.repository.fetch_type_counts(months, feeder_ids, cause_key))
        return causes, types

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
