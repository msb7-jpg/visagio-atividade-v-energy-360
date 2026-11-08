"""Backtest da fila: refaz a seleção na data de corte e a mede nas inspeções dos meses seguintes."""

from datetime import date

from sqlalchemy import Boolean, Float, String, column, select, table
from sqlalchemy.ext.asyncio import AsyncSession

from app.features.loss_management.backtest_formulas import (
    MIN_SAMPLE_PER_REASON,
    BacktestOutcome,
    FieldInspection,
    evaluate_selection,
    outcome_window,
)
from app.features.loss_management.backtest_schemas import (
    BacktestDTO,
    BacktestFilterDTO,
    BandBacktestDTO,
    ReasonBacktestDTO,
)
from app.features.loss_management.queries import shift_competencia
from app.features.loss_management.repository import LossRepository
from app.features.loss_management.schemas import SuspiciousUnitsFilterDTO
from app.features.loss_management.scoring import rank_suspicious_units
from app.features.loss_management.service import suspicion_filters
from app.shared.exceptions import BadRequestException

COMPETENCIA_LENGTH = 7

inspection_results = table(
    "fato_inspecoes_perdas",
    column("id_uc", String),
    column("data_inspecao", String),
    column("irregularidade_constatada", Boolean),
    column("kwh_recuperado", Float),
)


async def fetch_window_inspections(session: AsyncSession, start: date, end: date) -> list[FieldInspection]:
    """Lê as inspeções de campo feitas entre `start` e `end` (inclusive)."""
    query = select(
        inspection_results.c.id_uc,
        inspection_results.c.data_inspecao,
        inspection_results.c.irregularidade_constatada,
        inspection_results.c.kwh_recuperado,
    ).where(
        inspection_results.c.id_uc.is_not(None),
        inspection_results.c.data_inspecao >= start.isoformat(),
        inspection_results.c.data_inspecao <= end.isoformat(),
    )
    rows = (await session.execute(query)).all()
    return [
        FieldInspection(id_uc, date.fromisoformat(inspected_on[:10]), irregular is True, kwh)
        for id_uc, inspected_on, irregular, kwh in rows
    ]


def available_cutoffs(first_date: str, last_date: str) -> list[str]:
    first_competencia, last_competencia = first_date[:COMPETENCIA_LENGTH], last_date[:COMPETENCIA_LENGTH]
    cutoffs = []
    cutoff = shift_competencia(first_competencia, -1)
    while cutoff < last_competencia:
        cutoffs.append(cutoff)
        cutoff = shift_competencia(cutoff, 1)
    return cutoffs


def _to_dto(filter_dto: BacktestFilterDTO, cutoff: str, cutoffs: list[str], outcome: BacktestOutcome) -> BacktestDTO:
    window_start, window_end = outcome_window(cutoff)
    return BacktestDTO(
        backtest_executado=True,
        cortes_disponiveis=cutoffs,
        data_corte=cutoff,
        janela_resultado_inicio=window_start,
        janela_resultado_fim=window_end,
        n_solicitado=filter_dto.tamanho,
        n_selecionadas=outcome.selected_total,
        n_inspecionadas=outcome.selected_inspected,
        n_irregulares=outcome.selected_irregular,
        precisao_selecao=outcome.precision,
        inspecoes_janela=outcome.window_inspections,
        linha_base=outcome.baseline,
        diferenca_pp=outcome.difference_pp,
        kwh_recuperado=outcome.kwh_recovered,
        por_motivo=[
            ReasonBacktestDTO(
                motivo=entry.reason,
                inspecionadas=entry.inspected,
                irregulares=entry.irregular,
                taxa=entry.rate,
                amostra_suficiente=entry.sufficient_sample,
            )
            for entry in outcome.by_reason
        ],
        amostra_minima_por_motivo=MIN_SAMPLE_PER_REASON,
        kwh_esperado=outcome.expected_kwh,
        chance_media_prevista=outcome.mean_chance,
        irregulares_janela=outcome.window_irregular_units,
        irregulares_na_fila=outcome.queue_irregular_units,
        por_faixa=[
            BandBacktestDTO(
                faixa=band.band,
                selecionadas=band.selected,
                inspecionadas=band.inspected,
                irregulares=band.irregular,
                taxa=band.rate,
                chance_prevista=band.mean_chance,
                kwh_esperado=band.expected_kwh,
                kwh_recuperado=band.recovered_kwh,
            )
            for band in outcome.by_band
        ],
    )


def _not_executed(filter_dto: BacktestFilterDTO) -> BacktestDTO:
    return BacktestDTO(
        backtest_executado=False,
        cortes_disponiveis=[],
        data_corte=None,
        janela_resultado_inicio=None,
        janela_resultado_fim=None,
        n_solicitado=filter_dto.tamanho,
        n_selecionadas=0,
        n_inspecionadas=0,
        n_irregulares=0,
        precisao_selecao=None,
        inspecoes_janela=0,
        linha_base=None,
        diferenca_pp=None,
        kwh_recuperado=0.0,
        por_motivo=[],
        amostra_minima_por_motivo=MIN_SAMPLE_PER_REASON,
    )


class BacktestService:
    """Mede, com dados reais de campo, quanto a seleção da fila acertaria numa data passada."""

    def __init__(self, repository: LossRepository) -> None:
        self.repository = repository

    async def run(self, filter_dto: BacktestFilterDTO) -> BacktestDTO:
        """Seleciona o top N da fila como estava na data de corte e mede o acerto nos 3 meses seguintes.

        A fila do corte usa só medições e inspeções até o fim da competência de corte; as inspeções posteriores
        só entram na medição, então não há vazamento temporal.

        Args:
            filter_dto: Competência de corte (vazio usa a anterior à primeira inspeção) e tamanho N da seleção.

        Returns:
            O resultado, ou `backtest_executado=False` se não há histórico de inspeções de campo.

        Raises:
            BadRequestException: Se o corte não está entre os disponíveis.
            DatabaseReadError: Se as tabelas Gold não puderem ser consultadas.
        """
        hit_rate = await self.repository.fetch_field_hit_rate()
        if hit_rate is None or not hit_rate.first_date or not hit_rate.last_date:
            return _not_executed(filter_dto)
        cutoffs = available_cutoffs(hit_rate.first_date, hit_rate.last_date)
        cutoff = filter_dto.corte or cutoffs[0]
        if cutoff not in cutoffs:
            raise BadRequestException(
                f"Data de corte fora do histórico de inspeções: use de {cutoffs[0]} a {cutoffs[-1]}."
            )
        cutoff_repository = LossRepository(
            self.repository.session, reference_competencia=cutoff, use_peers=filter_dto.modelo == "novo"
        )
        candidates = await cutoff_repository.fetch_consumption_profiles(suspicion_filters(SuspiciousUnitsFilterDTO()))
        tariff = await cutoff_repository.fetch_average_tariff()
        full_queue = rank_suspicious_units(
            candidates.profiles,
            None,
            tariff_rs_kwh=tariff.rs_per_kwh,
            portfolio_ratio=candidates.portfolio_ratio,
        )
        ranked = full_queue[: filter_dto.tamanho]
        selection = {unit.id_uc: unit.motivos[0] for unit in ranked}
        window_start, window_end = outcome_window(cutoff)
        inspections = await fetch_window_inspections(self.repository.session, window_start, window_end)
        outcome = evaluate_selection(
            selection,
            inspections,
            units={unit.id_uc: unit for unit in ranked},
            queue_ids={unit.id_uc for unit in full_queue},
        )
        return _to_dto(filter_dto, cutoff, cutoffs, outcome)
