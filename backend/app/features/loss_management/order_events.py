"""Trilha de auditoria das ordens de inspeção: o que mudou (antes e depois), quem mudou e quando."""

import json
from collections.abc import Mapping, Sequence
from datetime import date, datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.features.loss_management.models import InspectionOrderEvent
from app.features.loss_management.schemas import InspectionOrderDTO, InspectionStatus

UNKNOWN_AUTHOR = "não informado"
AUDITED_FIELDS = (
    "status",
    "inspetor",
    "data_inspecao",
    "irregularidade_constatada",
    "tipo_irregularidade",
    "kwh_recuperado",
    "numero_toi",
    "motivo_cancelamento",
    "justificativa_cancelamento",
)
EVENT_TYPE_BY_STATUS = {
    InspectionStatus.GERADA: "gerada",
    InspectionStatus.PENDENTE: "em_campo",
    InspectionStatus.CONCLUIDA: "concluida",
    InspectionStatus.CANCELADA: "cancelada",
}


class OrderEventDTO(BaseModel):
    """Um passo da trilha de auditoria de uma ordem."""

    id_evento: int
    id_inspecao: int
    tipo: str = Field(description="gerada, em_campo, concluida, cancelada, resultado_importado ou atualizada")
    status_anterior: str | None
    status_novo: str | None
    autor: str = Field(description="E-mail do usuário que fez a mudança")
    alteracoes: dict[str, list[Any]] = Field(description="Por campo: [valor antes, valor depois]")
    criado_em: datetime


def plain(value: object) -> object:
    """Valor em formato JSON: enums pelo valor e datas em ISO."""
    if isinstance(value, Enum):
        return value.value
    if isinstance(value, date | datetime):
        return value.isoformat()
    return value


def build_changes(before: InspectionOrderDTO, after: InspectionOrderDTO) -> dict[str, list[object]]:
    """Compara os campos auditados de duas versões da ordem.

    Args:
        before: A ordem antes da mudança.
        after: A ordem depois da mudança.

    Returns:
        Só os campos que mudaram, cada um como `[antes, depois]`; vazio se nada auditado mudou.
    """
    changes: dict[str, list[object]] = {}
    for field_name in AUDITED_FIELDS:
        old_value, new_value = getattr(before, field_name), getattr(after, field_name)
        if old_value != new_value:
            changes[field_name] = [plain(old_value), plain(new_value)]
    return changes


def event_type(before: InspectionStatus, after: InspectionStatus) -> str:
    """Tipo do evento: segue o novo status, ou `atualizada` se só mudaram dados da ordem."""
    return "atualizada" if before == after else EVENT_TYPE_BY_STATUS[after]


def to_event_dto(event: InspectionOrderEvent) -> OrderEventDTO:
    """Converte a linha da trilha no DTO da API."""
    return OrderEventDTO(
        id_evento=event.id_evento,
        id_inspecao=event.id_inspecao,
        tipo=event.tipo,
        status_anterior=event.status_anterior,
        status_novo=event.status_novo,
        autor=event.autor,
        alteracoes=json.loads(event.alteracoes),
        criado_em=event.criado_em,
    )


def new_event(
    id_inspecao: int,
    *,
    tipo: str,
    status_anterior: str | None,
    status_novo: str | None,
    autor: str | None,
    alteracoes: Mapping[str, Sequence[object]],
) -> InspectionOrderEvent:
    """Monta a linha da trilha, ainda sem gravar; quem grava decide a transação."""
    return InspectionOrderEvent(
        id_inspecao=id_inspecao,
        tipo=tipo,
        status_anterior=status_anterior,
        status_novo=status_novo,
        autor=autor or UNKNOWN_AUTHOR,
        alteracoes=json.dumps(alteracoes, ensure_ascii=False),
    )


class OrderEventRepositoryMixin:
    """Gravação e leitura da trilha de auditoria (`ordem_inspecao_evento`)."""

    session: AsyncSession

    async def record_order_event(
        self,
        id_inspecao: int,
        *,
        tipo: str,
        status_anterior: str | None,
        status_novo: str | None,
        autor: str | None,
        alteracoes: Mapping[str, Sequence[object]],
    ) -> None:
        """Acrescenta um passo à trilha da ordem (a trilha só recebe inserções).

        Args:
            id_inspecao: Ordem alterada.
            tipo: Tipo do evento (ver `OrderEventDTO`).
            status_anterior: Status antes da mudança; vazio na geração ou quando não é conhecido.
            status_novo: Status depois da mudança.
            autor: E-mail de quem fez a mudança; vazio grava "não informado".
            alteracoes: Por campo, `[antes, depois]`.
        """
        event = new_event(
            id_inspecao,
            tipo=tipo,
            status_anterior=status_anterior,
            status_novo=status_novo,
            autor=autor,
            alteracoes=alteracoes,
        )
        self.session.add(event)
        await self.session.commit()

    async def record_creation_event(self, order: InspectionOrderDTO, autor: str | None) -> None:
        """Abre a trilha da ordem recém-gerada."""
        await self.record_order_event(
            order.id_inspecao,
            tipo=EVENT_TYPE_BY_STATUS[order.status],
            status_anterior=None,
            status_novo=order.status.value,
            autor=autor,
            alteracoes={},
        )

    async def record_update_event(
        self, before: InspectionOrderDTO, after: InspectionOrderDTO, autor: str | None
    ) -> None:
        """Acrescenta à trilha o que mudou entre duas versões da ordem."""
        await self.record_order_event(
            after.id_inspecao,
            tipo=event_type(before.status, after.status),
            status_anterior=before.status.value,
            status_novo=after.status.value,
            autor=autor,
            alteracoes=build_changes(before, after),
        )

    async def list_order_events(self, id_inspecao: int) -> list[OrderEventDTO]:
        """Lista a trilha de uma ordem, do primeiro passo ao mais recente.

        Args:
            id_inspecao: Ordem consultada.

        Returns:
            Eventos em ordem cronológica; vazio para ordens anteriores à trilha.
        """
        query = (
            select(InspectionOrderEvent)
            .where(InspectionOrderEvent.id_inspecao == id_inspecao)
            .order_by(InspectionOrderEvent.id_evento)
        )
        return [to_event_dto(event) for event in (await self.session.scalars(query)).all()]
