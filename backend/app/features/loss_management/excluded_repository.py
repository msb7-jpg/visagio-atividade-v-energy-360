"""Consulta da aba "Fora da fila": UCs com sinal de queda que a fila deixou de fora, e por quê."""

import logging
from collections import defaultdict
from collections.abc import Mapping
from datetime import date, datetime
from operator import itemgetter

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.features.loss_management.daily_cache import DailyEngineCache
from app.features.loss_management.excluded_schemas import ExcludedUnitDTO
from app.features.loss_management.exclusion_rules import Exclusion, InspectionEvent, classify_exclusion
from app.features.loss_management.models import InspectionOrder
from app.features.loss_management.peers import fetch_peer_ratios
from app.features.loss_management.portfolio_repository import NEUTRAL_PORTFOLIO_RATIO, PortfolioRepositoryMixin
from app.features.loss_management.queries import (
    COMPLETED_STATUS,
    ConsumptionWindows,
    SuspicionFilters,
    build_windows,
    fato_inspecoes_perdas,
    inspection_cutoff_date,
    latest_competencia_query,
)
from app.features.loss_management.queue_query import (
    BLOCKING_CANCELLATION_REASONS,
    cancellation_block_start,
    evaluated_profiles_query,
    orders_until_condition,
)
from app.features.loss_management.queue_repository import (
    GOLD_QUERY_ERRORS,
    GOLD_TABLES_ERROR_MESSAGE,
    QueueSummaryRepositoryMixin,
)
from app.features.loss_management.queue_rows_cache import orders_version_query
from app.features.loss_management.reference import AnalysisReference, resolve_analysis_reference
from app.features.loss_management.schemas import InspectionStatus
from app.features.loss_management.scoring import LIMIAR_QUEDA_MODERADA
from app.shared.exceptions import DatabaseReadError

logger = logging.getLogger(__name__)

# Depende dos mesmos dados que a fila: vale o dia e refaz quando uma ordem se encerra (ver `queue_rows_cache`).
_excluded_units_cache = DailyEngineCache[list[ExcludedUnitDTO]]()


def _as_date(value: str | date | datetime) -> date:
    if isinstance(value, datetime):
        return value.date()
    return value if isinstance(value, date) else date.fromisoformat(value[:10])


def _to_dto(row: Mapping, exclusion: Exclusion) -> ExcludedUnitDTO:
    return ExcludedUnitDTO(
        id_uc=row["id_uc"],
        municipio=row["municipio"],
        bairro=row["bairro"],
        classe_consumo=row["classe_consumo"],
        motivo_exclusao=exclusion.reason,
        data_evento=exclusion.event_date,
        volta_a_ser_avaliada=exclusion.returns_on,
    )


class ExcludedUnitsRepositoryMixin(QueueSummaryRepositoryMixin, PortfolioRepositoryMixin):
    """Leitura das exclusões da fila, no mesmo recorte de referência da fila."""

    session: AsyncSession
    reference_competencia: str | None
    use_peers: bool

    async def _resolve_reference(self) -> AnalysisReference | None:
        latest = await self.session.scalar(latest_competencia_query())
        return None if latest is None else resolve_analysis_reference(latest, self.reference_competencia)

    async def fetch_inspection_events(
        self, windows: ConsumptionWindows, history_until: date | None
    ) -> dict[str, list[InspectionEvent]]:
        events: dict[str, list[InspectionEvent]] = defaultdict(list)
        cutoff = inspection_cutoff_date(windows)
        completed = select(
            InspectionOrder.id_uc, InspectionOrder.atualizado_em, InspectionOrder.irregularidade_constatada
        ).where(
            InspectionOrder.status == COMPLETED_STATUS,
            InspectionOrder.atualizado_em >= datetime.combine(cutoff, datetime.min.time()),
            *orders_until_condition(history_until),
        )
        for id_uc, finished_at, irregular in (await self.session.execute(completed)).all():
            events[id_uc].append(InspectionEvent(_as_date(finished_at), irregular is True))
        if await self.has_field_history_table():
            history = fato_inspecoes_perdas
            field = select(history.c.id_uc, history.c.data_inspecao, history.c.irregularidade_constatada).where(
                history.c.id_uc.is_not(None), history.c.data_inspecao >= cutoff.isoformat()
            )
            if history_until is not None:
                field = field.where(history.c.data_inspecao < history_until.isoformat())
            for id_uc, inspected_on, irregular in (await self.session.execute(field)).all():
                events[id_uc].append(InspectionEvent(_as_date(inspected_on), irregular is True))
        return events

    async def fetch_cancellation_dates(self, history_until: date | None) -> dict[str, list[date]]:
        query = select(InspectionOrder.id_uc, InspectionOrder.atualizado_em).where(
            InspectionOrder.status == InspectionStatus.CANCELADA.value,
            InspectionOrder.motivo_cancelamento.in_([reason.value for reason in BLOCKING_CANCELLATION_REASONS]),
            InspectionOrder.atualizado_em >= cancellation_block_start(history_until),
            *orders_until_condition(history_until),
        )
        dates: dict[str, list[date]] = defaultdict(list)
        for id_uc, cancelled_at in (await self.session.execute(query)).all():
            dates[id_uc].append(_as_date(cancelled_at))
        return dates

    async def fetch_excluded_units(self, queue_ids: set[str]) -> list[ExcludedUnitDTO]:
        """Lista as UCs com sinal de suspeita que não estão na fila, com o motivo e a data de reavaliação.

        O cálculo varre a carteira inteira, então fica em cache até o fim do dia, por referência, por versão das
        ordens encerradas (as mesmas que refazem a fila) e pelas UCs que a fila tinha. Trocar de página ou de filtro
        não o refaz.

        Args:
            queue_ids: UCs que a fila tem agora (calculada com a mesma referência).

        Returns:
            UCs excluídas, ordenadas por `id_uc`; vazio se ainda não há medições.

        Raises:
            DatabaseReadError: Se as tabelas Gold estiverem ausentes ou fora do contrato.
        """
        try:
            reference = await self._resolve_reference()
            if reference is None:
                return []
            closed_orders = tuple((await self.session.execute(orders_version_query())).one())
            # As UCs da fila entram na chave: se uma ordem fecha entre o cálculo da fila e o das exclusões, a lista
            # calculada para uma fila não pode servir a outra.
            key = (reference.competencia, reference.history_until, closed_orders, frozenset(queue_ids))
            return await _excluded_units_cache.get_or_compute(
                self.session.get_bind(), key, lambda: self._compute_excluded_units(reference, queue_ids)
            )
        except GOLD_QUERY_ERRORS as e:
            logger.exception("Falha ao consultar as UCs fora da fila.")
            raise DatabaseReadError(GOLD_TABLES_ERROR_MESSAGE) from e

    async def _compute_excluded_units(self, reference: AnalysisReference, queue_ids: set[str]) -> list[ExcludedUnitDTO]:
        windows = build_windows(reference.competencia)
        portfolio_ratio = NEUTRAL_PORTFOLIO_RATIO
        peer_ratios = None
        if self.use_peers:
            portfolio_ratio = await self.fetch_portfolio_ratio(reference.competencia)
            peer_ratios = await fetch_peer_ratios(self.session, reference.competencia, portfolio_ratio)
        query = evaluated_profiles_query(
            windows,
            SuspicionFilters(limiar_queda=LIMIAR_QUEDA_MODERADA),
            peer_ratios=peer_ratios,
            portfolio_ratio=portfolio_ratio,
        )
        evaluated = (await self.session.execute(query)).mappings().all()
        inspections = await self.fetch_inspection_events(windows, reference.history_until)
        cancellations = await self.fetch_cancellation_dates(reference.history_until)
        excluded: list[ExcludedUnitDTO] = []
        for row in sorted(evaluated, key=itemgetter("id_uc")):
            if row["id_uc"] in queue_ids:
                continue
            exclusion = classify_exclusion(
                has_gd=bool(row["possui_gd"]),
                inspections=inspections.get(row["id_uc"], []),
                cancellation_dates=cancellations.get(row["id_uc"], []),
                windows=windows,
            )
            if exclusion is not None:
                excluded.append(_to_dto(row, exclusion))
        return excluded
