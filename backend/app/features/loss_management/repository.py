"""Acesso a dados da gestão de perdas: perfis de consumo (Gold) e ordens de inspeção."""

import logging
from collections.abc import Mapping

from sqlalchemy import exists, select
from sqlalchemy.exc import OperationalError, ProgrammingError
from sqlalchemy.ext.asyncio import AsyncSession

from app.features.loss_management.models import InspectionOrder
from app.features.loss_management.queries import (
    ACTIVE_STATUSES,
    SuspicionFilters,
    build_windows,
    latest_competencia_query,
    suspicious_profiles_query,
)
from app.features.loss_management.schemas import InspectionOrderCreateDTO, InspectionStatus
from app.features.loss_management.scoring import LIMIAR_QUEDA_SUBITA, ConsumptionProfile
from app.shared.exceptions import DatabaseReadError

logger = logging.getLogger(__name__)

# Tabela ausente (SQLite: OperationalError; Postgres: ProgrammingError) ou coluna fora do contrato Gold.
GOLD_QUERY_ERRORS = (OperationalError, ProgrammingError)


class LossRepository:
    """Consultas analíticas de consumo e persistência das ordens de inspeção."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def fetch_consumption_profiles(
        self, municipio: str | None, classe: str | None
    ) -> list[ConsumptionProfile]:
        filters = SuspicionFilters(limiar_queda=LIMIAR_QUEDA_SUBITA, municipio=municipio, classe=classe)
        try:
            ultima_competencia = await self.session.scalar(latest_competencia_query())
            if ultima_competencia is None:
                return []
            query = suspicious_profiles_query(build_windows(ultima_competencia), filters)
            result = await self.session.execute(query)
        except GOLD_QUERY_ERRORS as e:
            logger.exception("Falha ao consultar tabelas Gold de medição para a fila de suspeitas.")
            raise DatabaseReadError(
                "Falha ao consultar tabelas Gold de medição (dim_unidade_consumidora/fato_medicao)."
            ) from e
        return [ConsumptionProfile(**row) for row in result.mappings()]

    async def list_orders(self, status: InspectionStatus | None) -> list[InspectionOrder]:
        query = select(InspectionOrder).order_by(InspectionOrder.criado_em.desc())
        filtered_query = query.where(InspectionOrder.status == status.value) if status else query
        result = await self.session.scalars(filtered_query)
        return list(result.all())

    async def get_order(self, id_inspecao: int) -> InspectionOrder | None:
        return await self.session.get(InspectionOrder, id_inspecao)

    async def has_active_order(self, id_uc: str) -> bool:
        active_order_exists = exists().where(
            InspectionOrder.id_uc == id_uc,
            InspectionOrder.status.in_(ACTIVE_STATUSES),
        )
        return bool(await self.session.scalar(select(active_order_exists)))

    async def create_order(self, payload: InspectionOrderCreateDTO, criado_por: str) -> InspectionOrder:
        order = InspectionOrder(
            **payload.model_dump(),
            status=InspectionStatus.GERADA.value,
            criado_por=criado_por,
        )
        self.session.add(order)
        await self.session.commit()
        await self.session.refresh(order)
        return order

    async def apply_changes(self, order: InspectionOrder, changes: Mapping[str, object]) -> InspectionOrder:
        for field_name, field_value in changes.items():
            setattr(order, field_name, field_value)
        await self.session.commit()
        await self.session.refresh(order)
        return order
