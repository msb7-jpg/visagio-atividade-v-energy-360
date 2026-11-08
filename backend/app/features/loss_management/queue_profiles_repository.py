"""Leitura dos perfis de consumo candidatos à fila, na competência de referência e em cache."""

from dataclasses import replace

from app.features.loss_management.peers import fetch_peer_ratios, profile_builder
from app.features.loss_management.portfolio_repository import NEUTRAL_PORTFOLIO_RATIO, PortfolioRepositoryMixin
from app.features.loss_management.queries import SuspicionFilters, build_windows, latest_competencia_query
from app.features.loss_management.queue_query import suspicious_profiles_query
from app.features.loss_management.queue_rows_cache import QueueRows, cached_queue_rows
from app.features.loss_management.reference import AnalysisReference, resolve_analysis_reference
from app.features.loss_management.scoring import RegisteredUnit


class QueueProfilesRepositoryMixin(PortfolioRepositoryMixin):
    """Consulta da fila: perfis de consumo das UCs candidatas e a mediana da carteira."""

    reference_competencia: str | None
    use_peers: bool

    async def attach_peer_ratio(self, unit: RegisteredUnit, reference_competencia: str) -> RegisteredUnit:
        """Com `use_peers`, devolve a UC com a mediana da sua classe no perfil, igual à dos perfis da fila.

        Args:
            unit: UC do cadastro com o perfil de consumo.
            reference_competencia: Competência em que as janelas de análise terminam ('YYYY-MM').

        Returns:
            A mesma UC, ou uma cópia com `peer_ratio` preenchido quando o modelo de pares está ligado.
        """
        if not self.use_peers:
            return unit
        portfolio_ratio = await self.fetch_portfolio_ratio(reference_competencia)
        peers_by_class = await fetch_peer_ratios(self.session, reference_competencia, portfolio_ratio)
        peer_ratio = peers_by_class.get(unit.profile.classe_consumo, portfolio_ratio)
        return replace(unit, profile=replace(unit.profile, peer_ratio=peer_ratio))

    async def _read_queue_rows(
        self, filters: SuspicionFilters, field_history_applied: bool
    ) -> tuple[AnalysisReference | None, QueueRows, float]:
        """Executa a consulta da fila na competência de referência (em cache, ver `queue_rows_cache`).

        Com `use_peers`, cada perfil leva a mediana de recente/base da sua classe (`peer_ratio`).

        Returns:
            A referência de análise, as linhas candidatas e a razão mediana recente/base da carteira;
            `(None, [], 1.0)` se ainda não há medições.
        """
        ultima_competencia = await self.session.scalar(latest_competencia_query())
        if ultima_competencia is None:
            return None, [], NEUTRAL_PORTFOLIO_RATIO
        reference = resolve_analysis_reference(ultima_competencia, self.reference_competencia)
        portfolio_ratio = await self.fetch_portfolio_ratio(reference.competencia)
        peer_ratios = (
            await fetch_peer_ratios(self.session, reference.competencia, portfolio_ratio) if self.use_peers else None
        )
        query = suspicious_profiles_query(
            build_windows(reference.competencia),
            filters,
            include_field_history=field_history_applied,
            history_until=reference.history_until,
            portfolio_ratio=portfolio_ratio,
            peer_ratios=peer_ratios,
        )
        peers_key = tuple(sorted(peer_ratios.items(), key=lambda entry: str(entry[0]))) if peer_ratios else None
        criteria = (filters, field_history_applied, reference.competencia, reference.history_until)
        key = (*criteria, portfolio_ratio, peers_key)
        profiles = await cached_queue_rows(self.session, key, query, profile_builder(peer_ratios, portfolio_ratio))
        return reference, profiles, portfolio_ratio
