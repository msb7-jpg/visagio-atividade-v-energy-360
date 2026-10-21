"""Acesso a dados da gestão de perdas: perfis de consumo (Gold) e ordens de inspeção."""

import logging

from sqlalchemy import exists, select
from sqlalchemy.exc import IntegrityError, OperationalError, ProgrammingError
from sqlalchemy.ext.asyncio import AsyncSession

from app.features.loss_management.exceptions import ActiveOrderConflictError
from app.features.loss_management.models import ACTIVE_STATUSES, InspectionOrder
from app.features.loss_management.queries import (
    SuspicionFilters,
    build_windows,
    latest_competencia_query,
    suspicious_profiles_query,
)
from app.features.loss_management.schemas import (
    InspectionOrderCreateDTO,
    InspectionOrderDTO,
    InspectionOrderUpdateDTO,
    InspectionStatus,
)
from app.features.loss_management.scoring import ConsumptionProfile
from app.shared.exceptions import DatabaseReadError

logger = logging.getLogger(__name__)

# Tabela ausente (SQLite: OperationalError; Postgres: ProgrammingError) ou coluna fora do contrato Gold.
GOLD_QUERY_ERRORS = (OperationalError, ProgrammingError)
GOLD_TABLES_ERROR_MESSAGE = (
    "Falha ao consultar tabelas Gold (dim_unidade_consumidora/fato_medicao/fato_inspecoes_perdas)."
)


def to_order_dto(order: InspectionOrder) -> InspectionOrderDTO:
    """Converte o modelo ORM em DTO, isolando o ORM dentro do repositório.

    Args:
        order: Ordem de inspeção carregada pela sessão.

    Returns:
        Representação da ordem para as camadas de serviço e transporte.
    """
    return InspectionOrderDTO.model_validate(order)


class LossRepository:
    """Consultas analíticas de consumo e persistência das ordens de inspeção."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def fetch_consumption_profiles(self, filters: SuspicionFilters) -> list[ConsumptionProfile]:
        """Busca os perfis de consumo candidatos à fila de suspeitas.

        A janela de análise é ancorada na competência mais recente de `fato_medicao`.

        Args:
            filters: Limiar de queda e filtros territoriais/de classe da fila.

        Returns:
            Perfis de consumo das UCs candidatas; lista vazia se ainda não há medições.

        Raises:
            DatabaseReadError: Se as tabelas Gold estiverem ausentes ou fora do contrato.
        """
        try:
            ultima_competencia = await self.session.scalar(latest_competencia_query())
            if ultima_competencia is None:
                return []
            query = suspicious_profiles_query(build_windows(ultima_competencia), filters)
            result = await self.session.execute(query)
        except GOLD_QUERY_ERRORS as e:
            logger.exception("Falha ao consultar tabelas Gold para a fila de suspeitas.")
            raise DatabaseReadError(GOLD_TABLES_ERROR_MESSAGE) from e
        return [ConsumptionProfile(**row) for row in result.mappings()]

    async def list_orders(self, status: InspectionStatus | None) -> list[InspectionOrderDTO]:
        """Lista as ordens de inspeção da mais recente para a mais antiga.

        Args:
            status: Status para filtrar; None devolve todas as ordens.

        Returns:
            Ordens de inspeção encontradas.
        """
        query = select(InspectionOrder).order_by(InspectionOrder.criado_em.desc())
        filtered_query = query.where(InspectionOrder.status == status.value) if status else query
        result = await self.session.scalars(filtered_query)
        return [to_order_dto(order) for order in result.all()]

    async def get_order(self, id_inspecao: int) -> InspectionOrderDTO | None:
        """Busca uma ordem de inspeção pelo identificador.

        Args:
            id_inspecao: Identificador da ordem.

        Returns:
            A ordem encontrada, ou None se não existir.
        """
        order = await self.session.get(InspectionOrder, id_inspecao)
        return to_order_dto(order) if order else None

    async def has_active_order(self, id_uc: str) -> bool:
        """Indica se a UC já possui ordem gerada ou pendente.

        Args:
            id_uc: Identificador da unidade consumidora.

        Returns:
            True se existir ordem ativa para a UC.
        """
        active_order_exists = exists().where(
            InspectionOrder.id_uc == id_uc,
            InspectionOrder.status.in_(ACTIVE_STATUSES),
        )
        return bool(await self.session.scalar(select(active_order_exists)))

    async def create_order(self, payload: InspectionOrderCreateDTO, criado_por: str) -> InspectionOrderDTO:
        """Persiste uma nova ordem com status inicial `gerada`.

        Args:
            payload: Dados de abertura da ordem.
            criado_por: E-mail do usuário que gerou a ordem.

        Returns:
            A ordem criada, com identificador e datas preenchidos.

        Raises:
            ActiveOrderConflictError: Se a UC já tiver ordem ativa (índice único parcial no banco).
        """
        order = InspectionOrder(
            **payload.model_dump(),
            status=InspectionStatus.GERADA.value,
            criado_por=criado_por,
        )
        self.session.add(order)
        try:
            await self.session.commit()
        except IntegrityError as e:
            await self.session.rollback()
            raise ActiveOrderConflictError(payload.id_uc) from e
        await self.session.refresh(order)
        return to_order_dto(order)

    async def update_order(self, id_inspecao: int, payload: InspectionOrderUpdateDTO) -> InspectionOrderDTO | None:
        """Aplica uma alteração já validada pelo serviço a uma ordem existente.

        Args:
            id_inspecao: Identificador da ordem.
            payload: Novo status e dados associados; campos None não são alterados.

        Returns:
            A ordem atualizada, ou None se ela não existir.
        """
        order = await self.session.get(InspectionOrder, id_inspecao)
        if order is None:
            return None
        informed_changes = payload.model_dump(exclude_none=True)
        for field_name, field_value in informed_changes.items():
            setattr(order, field_name, field_value)
        await self.session.commit()
        await self.session.refresh(order)
        return to_order_dto(order)
