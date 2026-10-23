"""Consultas e gravações do upload da planilha de campo, compartilhadas pelo `LossRepository`."""

from collections.abc import Collection, Mapping
from itertools import batched

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.features.loss_management.models import ACTIVE_STATUSES, InspectionOrder
from app.features.loss_management.schemas import InspectionOrderUpdateDTO, InspectionStatus

ID_BATCH_SIZE = 500  # abaixo do limite de 999 variáveis do SQLite antigo


class FieldUploadRepositoryMixin:
    """Operações em lote sobre `ordem_inspecao` usadas na conciliação da planilha de campo."""

    session: AsyncSession

    async def get_active_order_ids_by_uc(self, unit_ids: Collection[str]) -> dict[str, int]:
        """Busca a ordem ativa (gerada ou pendente) de cada UC citada, por lotes.

        Args:
            unit_ids: Identificadores das unidades consumidoras.

        Returns:
            Identificador da ordem ativa por UC; UCs sem ordem ativa ficam de fora (há no máximo uma por UC).
        """
        active_order_ids: dict[str, int] = {}
        for unit_batch in batched(sorted(unit_ids), ID_BATCH_SIZE):
            query = select(InspectionOrder.id_uc, InspectionOrder.id_inspecao).where(
                InspectionOrder.id_uc.in_(unit_batch), InspectionOrder.status.in_(ACTIVE_STATUSES)
            )
            result = await self.session.execute(query)
            active_order_ids.update(dict(result.all()))
        return active_order_ids

    async def get_order_statuses(self, ids: Collection[int]) -> dict[int, InspectionStatus]:
        """Busca o status atual das ordens citadas, numa única consulta.

        Args:
            ids: Identificadores das ordens.

        Returns:
            Status por identificador; ordens inexistentes ficam de fora.
        """
        statuses: dict[int, InspectionStatus] = {}
        for id_batch in batched(sorted(ids), ID_BATCH_SIZE):
            query = select(InspectionOrder.id_inspecao, InspectionOrder.status).where(
                InspectionOrder.id_inspecao.in_(id_batch)
            )
            result = await self.session.execute(query)
            statuses.update({id_inspecao: InspectionStatus(status) for id_inspecao, status in result.all()})
        return statuses

    async def apply_field_results(self, updates: Mapping[int, InspectionOrderUpdateDTO]) -> list[int]:
        """Conclui, num único commit, as ordens que ainda estão em campo.

        Args:
            updates: Resultado de campo já validado, por identificador de ordem.

        Returns:
            Identificadores das ordens de fato atualizadas; as que deixaram o fluxo de campo entre a
            validação e a gravação (ex.: canceladas por outro usuário) ficam intactas e de fora.
        """
        applied_ids: list[int] = []
        for id_batch in batched(sorted(updates), ID_BATCH_SIZE):
            query = select(InspectionOrder).where(
                InspectionOrder.id_inspecao.in_(id_batch), InspectionOrder.status.in_(ACTIVE_STATUSES)
            )
            for order in (await self.session.scalars(query)).all():
                for field_name, field_value in updates[order.id_inspecao].model_dump(exclude_none=True).items():
                    setattr(order, field_name, field_value)
                applied_ids.append(order.id_inspecao)
        await self.session.commit()
        return applied_ids
