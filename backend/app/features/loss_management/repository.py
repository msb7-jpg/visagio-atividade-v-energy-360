"""Acesso a dados da gestão de perdas: perfis de consumo (Gold) e ordens de inspeção."""

from collections.abc import Mapping

from sqlalchemy import exists, select, text
from sqlalchemy.exc import OperationalError
from sqlalchemy.ext.asyncio import AsyncSession

from app.features.loss_management.models import InspectionOrder
from app.features.loss_management.schemas import InspectionOrderCreateDTO, InspectionStatus
from app.features.loss_management.scoring import LIMIAR_QUEDA_SUBITA, ConsumptionProfile
from app.shared.exceptions import DatabaseReadError

ACTIVE_STATUSES = (InspectionStatus.GERADA.value, InspectionStatus.PENDENTE.value)

# Janela recente = 3 últimas competências; base = 12 competências anteriores a ela.
CONSUMPTION_PROFILES_SQL = text("""
WITH referencia AS (
    SELECT
        strftime('%Y-%m', MAX(competencia) || '-01', '-2 months') AS inicio_recente,
        strftime('%Y-%m', MAX(competencia) || '-01', '-14 months') AS inicio_base
    FROM fato_medicao
),
consumo AS (
    SELECT
        med.id_uc,
        AVG(CASE WHEN med.competencia < ref.inicio_recente THEN med.consumo_kwh END) AS consumo_base_kwh,
        AVG(CASE WHEN med.competencia >= ref.inicio_recente THEN med.consumo_kwh END) AS consumo_recente_kwh,
        SUM(CASE WHEN med.competencia >= ref.inicio_recente AND med.consumo_kwh = 0 THEN 1 ELSE 0 END)
            AS meses_zerados
    FROM fato_medicao AS med
    CROSS JOIN referencia AS ref
    WHERE med.competencia >= ref.inicio_base
    GROUP BY med.id_uc
)
SELECT
    uc.id_uc, uc.municipio, uc.bairro, uc.classe_consumo,
    consumo.consumo_base_kwh, consumo.consumo_recente_kwh, consumo.meses_zerados
FROM consumo
JOIN dim_unidade_consumidora AS uc ON uc.id_uc = consumo.id_uc
WHERE COALESCE(uc.possui_gd, 0) = 0
  AND consumo.consumo_base_kwh > 0
  AND consumo.consumo_recente_kwh IS NOT NULL
  AND (consumo.consumo_recente_kwh <= consumo.consumo_base_kwh * (1 - :limiar_queda)
       OR consumo.meses_zerados > 0)
  AND (:municipio IS NULL OR uc.municipio = :municipio)
  AND (:classe IS NULL OR uc.classe_consumo = :classe)
  AND uc.id_uc NOT IN (
      SELECT id_uc FROM ordem_inspecao WHERE status IN ('gerada', 'pendente')
  )
""")


class LossRepository:
    """Consultas analíticas de consumo e persistência das ordens de inspeção."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def fetch_consumption_profiles(
        self, municipio: str | None, classe: str | None
    ) -> list[ConsumptionProfile]:
        params = {"limiar_queda": LIMIAR_QUEDA_SUBITA, "municipio": municipio, "classe": classe}
        try:
            result = await self.session.execute(CONSUMPTION_PROFILES_SQL, params)
        except OperationalError as e:
            raise DatabaseReadError(
                "Tabelas Gold de medição indisponíveis (dim_unidade_consumidora/fato_medicao)."
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
