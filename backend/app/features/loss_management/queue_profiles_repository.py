"""Leitura dos perfis de consumo candidatos à fila, na competência de referência e em cache."""

from app.features.loss_management.peers import fetch_peer_ratios, profile_builder
from app.features.loss_management.portfolio_repository import NEUTRAL_PORTFOLIO_RATIO, PortfolioRepositoryMixin
from app.features.loss_management.queries import SuspicionFilters, build_windows, latest_competencia_query
from app.features.loss_management.queue_query import suspicious_profiles_query
from app.features.loss_management.queue_rows_cache import QueueRows, cached_queue_rows
from app.features.loss_management.reference import AnalysisReference, resolve_analysis_reference


class QueueProfilesRepositoryMixin(PortfolioRepositoryMixin):
    """Consulta da fila: perfis de consumo das UCs candidatas e a mediana da carteira."""

    reference_competencia: str | None
    use_peers: bool

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
