"""Aba "Fora da fila": resumo por motivo e página das UCs excluídas."""

from collections import Counter

from app.features.loss_management.excluded_schemas import (
    ExcludedQueueDTO,
    ExcludedUnitsFilterDTO,
    ExclusionCountDTO,
    ExclusionReason,
)
from app.features.loss_management.repository import LossRepository
from app.features.loss_management.schemas import SuspiciousUnitsFilterDTO
from app.features.loss_management.service import suspicion_filters


class ExcludedQueueService:
    """Explica por que cada UC com queda de consumo não está na fila."""

    def __init__(self, repository: LossRepository) -> None:
        self.repository = repository

    async def list_excluded_units(self, excluded_filter: ExcludedUnitsFilterDTO) -> ExcludedQueueDTO:
        """Lista as UCs com sinal de queda que ficaram fora da fila, com motivo e data de reavaliação.

        Args:
            excluded_filter: Motivo opcional e página (`offset` e `limit`).

        Returns:
            A página de UCs excluídas, o total do filtro e o resumo por motivo (do conjunto inteiro, sem filtro).

        Raises:
            DatabaseReadError: Se as tabelas Gold não puderem ser consultadas.
        """
        candidates = await self.repository.fetch_consumption_profiles(suspicion_filters(SuspiciousUnitsFilterDTO()))
        queue_ids = {profile.id_uc for profile in candidates.profiles}
        excluded = await self.repository.fetch_excluded_units(queue_ids)
        totals = Counter(unit.motivo_exclusao for unit in excluded)
        summary = [
            ExclusionCountDTO(motivo=reason, total=totals[reason]) for reason in ExclusionReason if totals[reason]
        ]
        selected = [
            unit
            for unit in excluded
            if excluded_filter.motivo is None or unit.motivo_exclusao == excluded_filter.motivo
        ]
        page = selected[excluded_filter.offset : excluded_filter.offset + excluded_filter.limit]
        return ExcludedQueueDTO(itens=page, total=len(selected), resumo=summary)
