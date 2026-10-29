"""Detalhe de uma UC da Fila de Inspeção: por que está na fila, a conta do score, o consumo e o histórico."""

from dataclasses import dataclass

from app.features.loss_management.detail_repository import UnitDetailRepository
from app.features.loss_management.detail_schemas import UnitDetailDTO
from app.features.loss_management.queue_summary import apply_situation
from app.features.loss_management.reference import AnalysisReference
from app.features.loss_management.repository import LossRepository
from app.features.loss_management.schemas import SuspiciousUnitDTO, SuspiciousUnitsFilterDTO
from app.features.loss_management.scoring import ConsumptionProfile, priority_key, rank_suspicious_units
from app.features.loss_management.service import suspicion_filters
from app.features.loss_management.unit_detail import (
    build_score_breakdown,
    explain_reasons,
    fill_monthly_series,
    series_competencias,
    sort_prior_inspections,
)
from app.shared.exceptions import NotFoundException


@dataclass(frozen=True, slots=True)
class QueuedUnit:
    """UC encontrada na fila, com o perfil que a colocou lá e o topo usado para normalizar o score."""

    unit: SuspiciousUnitDTO
    profile: ConsumptionProfile
    top_expected_kwh: float
    reference: AnalysisReference
    portfolio_ratio: float = 1.0


class UnitDetailService:
    """Monta o detalhe de uma UC que está na fila de inspeção."""

    def __init__(self, queue_repository: LossRepository, detail_repository: UnitDetailRepository) -> None:
        self.queue_repository = queue_repository
        self.detail_repository = detail_repository

    async def get_unit_detail(self, id_uc: str) -> UnitDetailDTO:
        """Devolve o detalhe de uma UC que está na fila (inclusive com ordem gerada ou em campo).

        A UC precisa estar na fila agora: UC com ordem concluída ou inspecionada na janela de análise sai da fila
        (D4) e não abre o detalhe. Ordem cancelada devolve a UC à fila, e ela abre normalmente.

        Args:
            id_uc: Unidade consumidora.

        Returns:
            Identificação, situação, motivo, a conta do score, o consumo de 12 meses e as inspeções anteriores.

        Raises:
            NotFoundException: Se a UC não existir no cadastro ou não estiver na fila.
            DatabaseReadError: Se as tabelas Gold não puderem ser consultadas.
        """
        queued = await self._find_in_queue(id_uc)
        competencias = series_competencias(queued.reference.competencia)
        consumption = await self.detail_repository.fetch_monthly_consumption(id_uc, competencias[0], competencias[-1])
        prior = await self.detail_repository.fetch_prior_inspections(id_uc, queued.reference.history_until)
        unit = queued.unit
        return UnitDetailDTO(
            id_uc=unit.id_uc,
            municipio=unit.municipio,
            bairro=unit.bairro,
            classe_consumo=unit.classe_consumo,
            situacao=unit.situacao,
            competencia_referencia=queued.reference.competencia,
            motivos=unit.motivos,
            motivo_resumo=explain_reasons(queued.profile, unit.motivos, queued.portfolio_ratio),
            consumo_base_kwh=unit.consumo_base_kwh,
            consumo_recente_kwh=unit.consumo_recente_kwh,
            decomposicao_score=build_score_breakdown(unit, queued.top_expected_kwh),
            consumo_mensal=fill_monthly_series(competencias, consumption),
            inspecoes_anteriores=sort_prior_inspections(prior),
        )

    async def _find_in_queue(self, id_uc: str) -> QueuedUnit:
        """Localiza a UC na fila completa, a mesma que a lista usa, para o score bater com ela."""
        reference = await self.detail_repository.resolve_reference()
        if reference is None:
            raise await self._not_in_queue_error(id_uc)
        queue_filters = suspicion_filters(SuspiciousUnitsFilterDTO())
        candidates = await self.queue_repository.fetch_consumption_profiles(queue_filters)
        tariff = await self.queue_repository.fetch_average_tariff()
        ranked_units = rank_suspicious_units(
            candidates.profiles, limit=None, tariff_rs_kwh=tariff.rs_per_kwh, portfolio_ratio=candidates.portfolio_ratio
        )
        found_unit = next((unit for unit in ranked_units if unit.id_uc == id_uc), None)
        if found_unit is None:
            raise await self._not_in_queue_error(id_uc)
        (unit,) = apply_situation([found_unit], candidates.active_orders)
        profile = next(profile for profile in candidates.profiles if profile.id_uc == id_uc)
        top_expected_kwh, _ = priority_key(ranked_units[0])
        return QueuedUnit(
            unit=unit,
            profile=profile,
            top_expected_kwh=top_expected_kwh,
            reference=reference,
            portfolio_ratio=candidates.portfolio_ratio,
        )

    async def _not_in_queue_error(self, id_uc: str) -> NotFoundException:
        registered_unit = await self.queue_repository.fetch_registered_unit(id_uc)
        if registered_unit is None:
            return NotFoundException(f"UC {id_uc} não encontrada no cadastro.")
        return NotFoundException(
            f"UC {id_uc} não está na fila de inspeção: sem sinal de perda, com geração distribuída ou já inspecionada."
        )
