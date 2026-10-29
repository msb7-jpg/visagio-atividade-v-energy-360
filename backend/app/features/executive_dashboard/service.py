from typing import Protocol

from app.features.executive_dashboard.cache import DashboardCache
from app.features.executive_dashboard.catalog import build_groups
from app.features.executive_dashboard.indicators import AreaTotals, PeriodSnapshots, WindowSnapshot
from app.features.executive_dashboard.schemas import DashboardIndicatorsDTO, LossesSnapshotDTO
from app.features.loss_management.queries import SuspicionFilters
from app.features.loss_management.queue_summary import FieldHitRate, hit_rate_dto
from app.features.loss_management.scoring import LIMIAR_QUEDA_MODERADA, QueueCandidates, rank_suspicious_units
from app.features.loss_management.tariff import AverageTariff
from app.features.revenue.exceptions import RevenueDataNotFoundError
from app.features.revenue.schemas import PeriodWindow, RevenueFilters
from app.features.revenue.service import PeriodTotalsReader, RevenueService

CASAS_PERCENTUAL = 1
LOSSES_CACHE_KEY = "fila"


class DashboardReader(Protocol):
    """Contrato do repositório do Painel: totais das demais áreas e período coberto pelos dados."""

    async def fetch_area_totals(self, base: PeriodWindow, current: PeriodWindow) -> tuple[AreaTotals, AreaTotals]:
        """Lê os totais de cobrança, rede, atendimento e medição das duas janelas."""
        ...

    async def fetch_available_period(self) -> PeriodWindow | None:
        """Lê a primeira e a última competência com faturamento."""
        ...

    async def fetch_latest_measurement(self) -> str | None:
        """Lê a competência mais recente com medição."""
        ...


class LossQueueReader(Protocol):
    """Contrato da Fila de Perdas (Fatia 05) usado no retrato do Painel."""

    async def fetch_consumption_profiles(self, filters: SuspicionFilters) -> QueueCandidates:
        """Lê os perfis candidatos à fila de suspeitas."""
        ...

    async def fetch_field_hit_rate(self) -> FieldHitRate | None:
        """Lê as contagens do histórico de inspeções de campo."""
        ...

    async def fetch_average_tariff(self) -> AverageTariff:
        """Lê a tarifa média da base (R$/kWh) que valora a energia recuperável."""
        ...


class ExecutiveDashboardService:
    """Junta receita (Fatia 04), demais áreas e perdas (Fatia 05) no Painel do Diretor."""

    def __init__(
        self,
        repository: DashboardReader,
        revenue_repository: PeriodTotalsReader,
        loss_repository: LossQueueReader,
        cache: DashboardCache | None = None,
    ) -> None:
        self.repository = repository
        self.revenue_repository = revenue_repository
        self.loss_repository = loss_repository
        self.cache = cache if cache is not None else DashboardCache()

    async def get_indicators(self, base: PeriodWindow, current: PeriodWindow) -> DashboardIndicatorsDTO:
        """Compara os indicadores de todas as áreas entre a janela base e a janela atual.

        Os totais de receita vêm da mesma consulta da tela de Receita, então os números são iguais aos de
        `/revenue/kpis` nas mesmas janelas. O resultado fica no cache por janela, porque a Gold só muda a cada carga.

        Args:
            base: Janela de referência (padrão: primeiro ano da base).
            current: Janela comparada (padrão: últimos 12 meses).

        Returns:
            As janelas, o período coberto pelos dados e um grupo de indicadores por área.

        Raises:
            InvalidPeriodError: Se a janela base não termina antes do início da janela atual.
            RevenueDataNotFoundError: Se não há faturamento em nenhuma das janelas.
            DatabaseReadError: Se uma tabela Gold não puder ser lida.
        """
        RevenueService.check_windows(base, current)
        cached = self.cache.indicators.get((base, current))
        if cached is not None:
            return cached
        revenue = await self.revenue_repository.fetch_period_totals(base, current, RevenueFilters())
        if revenue.base.faturas == 0 and revenue.current.faturas == 0:
            raise RevenueDataNotFoundError(base, current)
        base_areas, current_areas = await self.repository.fetch_area_totals(base, current)
        snapshots = PeriodSnapshots(
            base_window=base,
            current_window=current,
            base=WindowSnapshot(revenue=revenue.base, areas=base_areas),
            current=WindowSnapshot(revenue=revenue.current, areas=current_areas),
        )
        dashboard = DashboardIndicatorsDTO(
            base=base,
            atual=current,
            periodo_disponivel=await self.repository.fetch_available_period(),
            grupos=build_groups(snapshots),
        )
        self.cache.indicators.put((base, current), dashboard)
        return dashboard

    async def get_losses_snapshot(self) -> LossesSnapshotDTO:
        """Retrato atual da Fila de Perdas, com o mesmo ranking e a mesma taxa de acerto da tela de perdas.

        Returns:
            UCs suspeitas, energia e valor recuperáveis e a taxa histórica de acerto das inspeções.

        Raises:
            DatabaseReadError: Se as tabelas Gold de cadastro, medição ou inspeções não puderem ser lidas.
        """
        cached = self.cache.losses.get(LOSSES_CACHE_KEY)
        if cached is not None:
            return cached
        candidates = await self.loss_repository.fetch_consumption_profiles(
            SuspicionFilters(limiar_queda=LIMIAR_QUEDA_MODERADA)
        )
        tariff = await self.loss_repository.fetch_average_tariff()
        ranked_units = rank_suspicious_units(
            candidates.profiles, limit=None, tariff_rs_kwh=tariff.rs_per_kwh, portfolio_ratio=candidates.portfolio_ratio
        )
        hit_rate = hit_rate_dto(await self.loss_repository.fetch_field_hit_rate())
        reference = candidates.reference_competencia or await self.repository.fetch_latest_measurement()
        snapshot = LossesSnapshotDTO(
            competencia_referencia=reference,
            competencia_fixada=candidates.reference_competencia is not None,
            ucs_na_fila=len(ranked_units),
            energia_recuperavel_kwh_mes=round(sum(unit.kwh_mes_recuperavel for unit in ranked_units), 1),
            valor_recuperavel_rs_ano=round(sum(unit.valor_ano_rs for unit in ranked_units), 2),
            taxa_acerto_pct=round(hit_rate.taxa * 100, CASAS_PERCENTUAL),
            inspecoes_avaliadas=hit_rate.inspecoes_total,
        )
        self.cache.losses.put(LOSSES_CACHE_KEY, snapshot)
        return snapshot
