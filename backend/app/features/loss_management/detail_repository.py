"""Acesso a dados do detalhe de uma UC: série mensal e inspeções anteriores, sempre filtrados por UC."""

import logging
from datetime import date

from sqlalchemy import inspect
from sqlalchemy.ext.asyncio import AsyncSession

from app.features.loss_management.detail_queries import (
    completed_orders_query,
    field_inspections_query,
    monthly_consumption_query,
)
from app.features.loss_management.detail_schemas import PriorInspectionDTO, PriorInspectionSource
from app.features.loss_management.queries import fato_inspecoes_perdas, latest_competencia_query
from app.features.loss_management.queue_repository import GOLD_QUERY_ERRORS, GOLD_TABLES_ERROR_MESSAGE
from app.features.loss_management.reference import AnalysisReference, resolve_analysis_reference
from app.shared.exceptions import DatabaseReadError

logger = logging.getLogger(__name__)


class UnitDetailRepository:
    """Consultas por UC (série de consumo, inspeções do histórico de campo e do portal)."""

    def __init__(self, session: AsyncSession, reference_competencia: str | None = None) -> None:
        """Cria o repositório da sessão.

        Args:
            session: Sessão assíncrona do banco.
            reference_competencia: Competência ('YYYY-MM') fixada para a análise; None usa a mais recente.
        """
        self.session = session
        self.reference_competencia = reference_competencia

    async def resolve_reference(self) -> AnalysisReference | None:
        """Resolve a competência da análise, a mesma usada para montar a fila.

        Returns:
            A referência de análise, ou None se ainda não há medições.

        Raises:
            DatabaseReadError: Se `fato_medicao` estiver ausente ou fora do contrato.
        """
        try:
            latest_competencia = await self.session.scalar(latest_competencia_query())
        except GOLD_QUERY_ERRORS as e:
            logger.exception("Falha ao consultar a competência mais recente para o detalhe da UC.")
            raise DatabaseReadError(GOLD_TABLES_ERROR_MESSAGE) from e
        if latest_competencia is None:
            return None
        return resolve_analysis_reference(latest_competencia, self.reference_competencia)

    async def fetch_monthly_consumption(
        self, id_uc: str, first_competencia: str, last_competencia: str
    ) -> dict[str, float]:
        """Busca o consumo mensal da UC no período, pelo índice por UC.

        Args:
            id_uc: Unidade consumidora.
            first_competencia: Primeira competência do período ('YYYY-MM').
            last_competencia: Última competência do período ('YYYY-MM').

        Returns:
            Consumo por competência, só dos meses com leitura válida.

        Raises:
            DatabaseReadError: Se `fato_medicao` estiver ausente ou fora do contrato.
        """
        query = monthly_consumption_query(id_uc, first_competencia, last_competencia)
        try:
            result = await self.session.execute(query)
        except GOLD_QUERY_ERRORS as e:
            logger.exception("Falha ao consultar o consumo mensal da UC %s.", id_uc)
            raise DatabaseReadError(GOLD_TABLES_ERROR_MESSAGE) from e
        return {competencia: float(consumo_kwh) for competencia, consumo_kwh in result.all()}

    async def fetch_prior_inspections(self, id_uc: str, history_until: date | None) -> list[PriorInspectionDTO]:
        """Busca as inspeções anteriores da UC: histórico de campo (se exportado) e ordens concluídas no portal.

        Args:
            id_uc: Unidade consumidora.
            history_until: Data (exclusiva) em que o histórico de campo deixa de valer, se a análise está fixada.

        Returns:
            Inspeções sem ordenação definida; vazio se a UC nunca foi inspecionada.

        Raises:
            DatabaseReadError: Se as tabelas existentes estiverem fora do contrato de colunas.
        """
        field_inspections = await self._fetch_field_inspections(id_uc, history_until)
        try:
            order_rows = (await self.session.execute(completed_orders_query(id_uc))).all()
        except GOLD_QUERY_ERRORS as e:
            logger.exception("Falha ao consultar as ordens concluídas da UC %s.", id_uc)
            raise DatabaseReadError(GOLD_TABLES_ERROR_MESSAGE) from e
        order_inspections = [
            PriorInspectionDTO(
                origem=PriorInspectionSource.ORDEM_PORTAL,
                data_inspecao=inspection_date,
                irregularidade_constatada=found_irregularity,
                inspetor=inspector,
            )
            for inspection_date, found_irregularity, inspector in order_rows
        ]
        return [*field_inspections, *order_inspections]

    async def _fetch_field_inspections(self, id_uc: str, history_until: date | None) -> list[PriorInspectionDTO]:
        has_table = await self.session.run_sync(
            lambda sync_session: inspect(sync_session.connection()).has_table(fato_inspecoes_perdas.name)
        )
        if not has_table:
            return []
        until_iso = history_until.isoformat() if history_until else None
        try:
            rows = (await self.session.execute(field_inspections_query(id_uc, until_iso))).all()
        except GOLD_QUERY_ERRORS as e:
            logger.exception("Falha ao consultar o histórico de inspeções da UC %s.", id_uc)
            raise DatabaseReadError(GOLD_TABLES_ERROR_MESSAGE) from e
        return [
            PriorInspectionDTO(
                origem=PriorInspectionSource.HISTORICO_CAMPO,
                data_inspecao=inspection_date,
                irregularidade_constatada=found_irregularity,
                inspetor=inspector,
            )
            for inspection_date, found_irregularity, inspector in rows
        ]
