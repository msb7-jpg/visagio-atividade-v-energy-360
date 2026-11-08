"""Curva de retorno da Fila de Inspeção: quantas inspeções valem a pena para a equipe."""

from app.features.loss_management.queue_curve import ReturnCurveDTO, build_return_curve
from app.features.loss_management.queue_summary import apply_situation
from app.features.loss_management.repository import LossRepository
from app.features.loss_management.schemas import QueueSituation, SuspiciousUnitsFilterDTO
from app.features.loss_management.scoring import rank_suspicious_units
from app.features.loss_management.service import suspicion_filters


class QueueCurveService:
    """Monta a curva de retorno acumulado a partir da mesma fila que a tela lista."""

    def __init__(self, repository: LossRepository) -> None:
        self.repository = repository

    async def build_curve(self, cost_rs: float | None, max_points: int) -> ReturnCurveDTO:
        """Calcula o retorno esperado somado por número de inspeções e o corte sugerido pelo custo.

        Só entram as UCs livres (sem ordem ativa): as que já têm ordem estão programadas.

        Args:
            cost_rs: Custo de uma inspeção em R$; None devolve só a curva.
            max_points: Máximo de pontos da curva devolvida.

        Returns:
            A curva e o corte sugerido.

        Raises:
            DatabaseReadError: Se as tabelas Gold não puderem ser consultadas.
        """
        candidates = await self.repository.fetch_consumption_profiles(suspicion_filters(SuspiciousUnitsFilterDTO()))
        tariff = await self.repository.fetch_average_tariff()
        ranked_units = rank_suspicious_units(
            candidates.profiles, limit=None, tariff_rs_kwh=tariff.rs_per_kwh, portfolio_ratio=candidates.portfolio_ratio
        )
        free_units = [
            unit
            for unit in apply_situation(ranked_units, candidates.active_orders)
            if unit.situacao == QueueSituation.NA_FILA
        ]
        return build_return_curve(free_units, cost_rs, max_points, tariff_rs_kwh=tariff.rs_per_kwh)
