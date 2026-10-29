"""Consultas dos cartões e dos filtros da Fila de Inspeção, compartilhadas pelo `LossRepository`."""

import logging

from sqlalchemy import ColumnClause, case, func, inspect, select
from sqlalchemy.exc import OperationalError, ProgrammingError
from sqlalchemy.ext.asyncio import AsyncSession

from app.features.loss_management.models import ACTIVE_STATUSES, InspectionOrder
from app.features.loss_management.queries import dim_unidade_consumidora, fato_inspecoes_perdas
from app.features.loss_management.queue_summary import FieldHitRate
from app.features.loss_management.schemas import InspectionStatus, InspectorDTO, QueueFiltersDTO
from app.shared.exceptions import DatabaseReadError

logger = logging.getLogger(__name__)

# Tabela ausente (SQLite: OperationalError; Postgres: ProgrammingError) ou coluna fora do contrato Gold.
GOLD_QUERY_ERRORS = (OperationalError, ProgrammingError)
GOLD_TABLES_ERROR_MESSAGE = (
    "Falha ao consultar tabelas Gold (dim_unidade_consumidora/fato_medicao/fato_inspecoes_perdas)."
)


class QueueSummaryRepositoryMixin:
    """Ordens ativas, taxa histórica de acerto e opções de filtro da tela."""

    session: AsyncSession

    async def fetch_active_order_statuses(self) -> dict[str, InspectionStatus]:
        """Busca o status da ordem ativa de cada UC (no máximo uma por UC, garantido pelo banco).

        Returns:
            Status (gerada ou pendente) por `id_uc`.
        """
        query = select(InspectionOrder.id_uc, InspectionOrder.status).where(
            InspectionOrder.status.in_(ACTIVE_STATUSES)
        )
        result = await self.session.execute(query)
        return {id_uc: InspectionStatus(order_status) for id_uc, order_status in result.all()}

    async def count_active_orders(self) -> int:
        """Conta as ordens ativas, que ocupam a capacidade mensal da equipe.

        Returns:
            Quantidade de ordens geradas ou pendentes.
        """
        query = select(func.count()).select_from(InspectionOrder).where(InspectionOrder.status.in_(ACTIVE_STATUSES))
        return await self.session.scalar(query) or 0

    async def has_field_history_table(self) -> bool:
        """Indica se `fato_inspecoes_perdas` (Fatia 02) já foi exportada; só a ausência da tabela é tolerada."""
        return await self.session.run_sync(
            lambda sync_session: inspect(sync_session.connection()).has_table(fato_inspecoes_perdas.name)
        )

    async def fetch_field_hit_rate(self) -> FieldHitRate | None:
        """Conta as inspeções do histórico de campo e quantas confirmaram irregularidade.

        Returns:
            As contagens e o período coberto; None se `fato_inspecoes_perdas` ainda não foi exportada.

        Raises:
            DatabaseReadError: Se a tabela existe mas está fora do contrato de colunas.
        """
        if not await self.has_field_history_table():
            return None
        is_confirmed = case((fato_inspecoes_perdas.c.irregularidade_constatada.is_(True), 1), else_=0)
        query = select(
            func.count(),
            func.coalesce(func.sum(is_confirmed), 0),
            func.min(fato_inspecoes_perdas.c.data_inspecao),
            func.max(fato_inspecoes_perdas.c.data_inspecao),
        )
        try:
            total, confirmed, first_date, last_date = (await self.session.execute(query)).one()
        except GOLD_QUERY_ERRORS as e:
            logger.exception("Falha ao consultar a taxa histórica de acerto.")
            raise DatabaseReadError(GOLD_TABLES_ERROR_MESSAGE) from e
        return FieldHitRate(total=total, confirmed=int(confirmed), first_date=first_date, last_date=last_date)

    async def fetch_filter_options(self) -> QueueFiltersDTO:
        """Lista os municípios e as classes de consumo do cadastro de UCs.

        Returns:
            Valores distintos e ordenados, sem nulos.

        Raises:
            DatabaseReadError: Se o cadastro de UCs estiver ausente ou fora do contrato.
        """
        try:
            municipios = await self._distinct_values(dim_unidade_consumidora.c.municipio)
            classes = await self._distinct_values(dim_unidade_consumidora.c.classe_consumo)
        except GOLD_QUERY_ERRORS as e:
            logger.exception("Falha ao consultar as opções de filtro da fila.")
            raise DatabaseReadError(GOLD_TABLES_ERROR_MESSAGE) from e
        return QueueFiltersDTO(municipios=municipios, classes=classes)

    async def _distinct_values(self, column: ColumnClause) -> list[str]:
        query = select(column).distinct().where(column.is_not(None)).order_by(column)
        result = await self.session.scalars(query)
        return list(result.all())

    async def list_inspectors(self) -> list[InspectorDTO]:
        """Lista os inspetores que aparecem no histórico de inspeções de campo.

        Returns:
            Códigos distintos em ordem crescente (INSP-001 a INSP-040).

        Raises:
            DatabaseReadError: Se `fato_inspecoes_perdas` estiver ausente ou fora do contrato.
        """
        try:
            codes = await self._distinct_values(fato_inspecoes_perdas.c.id_inspetor)
        except GOLD_QUERY_ERRORS as e:
            logger.exception("Falha ao consultar os inspetores do histórico de campo.")
            raise DatabaseReadError(GOLD_TABLES_ERROR_MESSAGE) from e
        return [InspectorDTO(codigo=code) for code in codes]
