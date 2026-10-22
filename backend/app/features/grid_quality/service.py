"""Regras de negócio da qualidade da rede: indicadores, ranking e histórico de DEC/FEC."""

from app.features.grid_quality.repository import GridQualityRepository
from app.features.grid_quality.rules import build_time_series_point, rank_feeders, summarize_indicators
from app.features.grid_quality.schemas import (
    FeederRankingDTO,
    FeederTimeSeriesDTO,
    QualityIndicatorsDTO,
    QualityStatus,
)
from app.shared.exceptions import NotFoundException

MESES_HISTORICO_MINIMO = 1
MESES_HISTORICO_PADRAO = 48
MESES_HISTORICO_MAXIMO = 48


class GridQualityService:
    """Orquestra a leitura de apurações e aplica as regras puras de DEC/FEC."""

    def __init__(self, repository: GridQualityRepository) -> None:
        self.repository = repository

    async def _resolve_competencia(self, competencia: str | None) -> str | None:
        if competencia is not None:
            return competencia
        return await self.repository.fetch_latest_competencia()

    async def get_indicators(self, competencia: str | None = None) -> QualityIndicatorsDTO:
        """Consolida os indicadores de uma competência.

        Args:
            competencia: Competência 'YYYY-MM'; sem valor usa a mais recente.

        Returns:
            Indicadores da competência; zerados quando não há apurações.
        """
        resolved_competencia = await self._resolve_competencia(competencia)
        if resolved_competencia is None:
            return summarize_indicators(None, [])
        rows = await self.repository.fetch_rows(resolved_competencia)
        return summarize_indicators(resolved_competencia, rows)

    async def list_feeders(
        self, competencia: str | None = None, status: QualityStatus | None = None
    ) -> list[FeederRankingDTO]:
        """Lista o ranking de alimentadores de uma competência.

        Args:
            competencia: Competência 'YYYY-MM'; sem valor usa a mais recente.
            status: Filtra pelo status regulatório; sem valor devolve todos.

        Returns:
            Alimentadores por maior excesso de DEC; lista vazia sem apurações.
        """
        resolved_competencia = await self._resolve_competencia(competencia)
        if resolved_competencia is None:
            return []
        rows = await self.repository.fetch_rows(resolved_competencia)
        ranking = rank_feeders(rows)
        if status is None:
            return ranking
        return [entry for entry in ranking if entry.status is status]

    async def get_feeder_history(
        self, id_alimentador: str, meses: int = MESES_HISTORICO_PADRAO
    ) -> FeederTimeSeriesDTO:
        """Devolve a série histórica mensal de um alimentador.

        Args:
            id_alimentador: Identificador do alimentador.
            meses: Quantidade máxima de competências.

        Returns:
            Série da competência mais antiga para a mais recente.

        Raises:
            NotFoundException: Se o alimentador não tem apurações.
        """
        rows = await self.repository.fetch_history(id_alimentador, meses)
        if not rows:
            raise NotFoundException(f"Alimentador '{id_alimentador}' sem dados de qualidade.")
        time_series_points = [build_time_series_point(row) for row in rows]
        return FeederTimeSeriesDTO(id_alimentador=id_alimentador, pontos=time_series_points)
