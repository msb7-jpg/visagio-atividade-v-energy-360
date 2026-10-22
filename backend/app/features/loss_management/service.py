"""Regras de negócio da fila de suspeitas e do ciclo de vida das ordens de inspeção."""

import asyncio

from app.features.loss_management.exceptions import ActiveOrderConflictError, InspectionConflictError
from app.features.loss_management.export import render_field_orders_csv
from app.features.loss_management.queries import SuspicionFilters
from app.features.loss_management.repository import LossRepository
from app.features.loss_management.schemas import (
    InspectionOrderCreateDTO,
    InspectionOrderDTO,
    InspectionOrderUpdateDTO,
    InspectionStatus,
    QueueWarningCode,
    QueueWarningDTO,
    RejectedRowDTO,
    SuspiciousQueueDTO,
    SuspiciousUnitsFilterDTO,
    UploadResultDTO,
)
from app.features.loss_management.scoring import LIMIAR_QUEDA_SUBITA, order_estimated_kwh, rank_suspicious_units
from app.features.loss_management.update_rules import ensure_fields_match_status, ensure_required_fields
from app.features.loss_management.upload_parser import read_spreadsheet
from app.features.loss_management.upload_reconcile import reconcile_rows, referenced_order_ids
from app.shared.exceptions import NotFoundException

ALLOWED_TRANSITIONS: dict[InspectionStatus, frozenset[InspectionStatus]] = {
    InspectionStatus.GERADA: frozenset({InspectionStatus.PENDENTE, InspectionStatus.CANCELADA}),
    InspectionStatus.PENDENTE: frozenset({InspectionStatus.CONCLUIDA, InspectionStatus.CANCELADA}),
    InspectionStatus.CONCLUIDA: frozenset(),
    InspectionStatus.CANCELADA: frozenset(),
}

FIELD_HISTORY_NOT_APPLIED_WARNING = QueueWarningDTO(
    codigo=QueueWarningCode.HISTORICO_CAMPO_NAO_APLICADO,
    mensagem=(
        "A tabela de inspeções (Fatia 02) ainda não está disponível, então UCs já inspecionadas em campo "
        "podem aparecer na fila. Ordens concluídas no sistema continuam sendo excluídas."
    ),
)


def validate_transition(current_status: InspectionStatus, payload: InspectionOrderUpdateDTO) -> None:
    """Garante que a mudança de status é permitida e traz apenas os dados compatíveis com ela.

    Fluxo: gerada -> pendente -> concluida; cancelamento permitido a partir de gerada/pendente.

    Args:
        current_status: Status atual da ordem.
        payload: Alteração solicitada.

    Raises:
        InspectionConflictError: Se a transição de status não for permitida.
        BadRequestException: Se faltarem dados obrigatórios ou vierem campos de outro status.
    """
    if payload.status not in ALLOWED_TRANSITIONS[current_status]:
        raise InspectionConflictError(
            f"Transição de status inválida: '{current_status}' -> '{payload.status}'."
        )
    ensure_required_fields(payload)
    ensure_fields_match_status(payload)


class LossService:
    """Orquestra a priorização de suspeitas e a gestão das ordens de inspeção."""

    def __init__(self, repository: LossRepository) -> None:
        self.repository = repository

    async def list_suspicious_units(self, queue_filter: SuspiciousUnitsFilterDTO) -> SuspiciousQueueDTO:
        """Monta a fila de UCs suspeitas priorizada pela energia estimada a recuperar.

        Args:
            queue_filter: Filtros de município, bairro e classe e o tamanho da fila.

        Returns:
            UCs suspeitas em ordem decrescente de kWh a recuperar, limitadas a `queue_filter.limit`,
            e os avisos de degradação da análise (ex.: histórico de campo não aplicado).

        Raises:
            DatabaseReadError: Se as tabelas Gold não puderem ser consultadas.
        """
        filters = SuspicionFilters(
            limiar_queda=LIMIAR_QUEDA_SUBITA,
            municipio=queue_filter.municipio,
            bairro=queue_filter.bairro,
            classe=queue_filter.classe,
        )
        candidates = await self.repository.fetch_consumption_profiles(filters)
        units = rank_suspicious_units(candidates.profiles, queue_filter.limit)
        warnings = [] if candidates.field_history_applied else [FIELD_HISTORY_NOT_APPLIED_WARNING]
        return SuspiciousQueueDTO(itens=units, avisos=warnings)

    async def list_inspections(self, status: InspectionStatus | None) -> list[InspectionOrderDTO]:
        """Lista as ordens de inspeção, opcionalmente filtradas por status.

        Args:
            status: Status para filtrar; None devolve todas.

        Returns:
            Ordens da mais recente para a mais antiga.
        """
        return await self.repository.list_orders(status)

    async def export_field_orders_csv(self) -> str:
        """Gera a planilha CSV das ordens que seguem para campo (geradas e pendentes).

        Returns:
            Conteúdo do CSV, com as colunas de resultado de campo em branco para a equipe preencher.
        """
        active_orders = await self.repository.list_active_orders()
        return render_field_orders_csv(active_orders)

    async def create_inspection(self, payload: InspectionOrderCreateDTO, criado_por: str) -> InspectionOrderDTO:
        """Gera uma ordem de inspeção para uma UC do cadastro.

        O kWh estimado é recalculado aqui com a regra da fila; UC fora da fila vira ordem manual com 0 kWh.

        Args:
            payload: UC e motivo da ordem.
            criado_por: E-mail do usuário que gerou a ordem.

        Returns:
            A ordem criada com status `gerada`.

        Raises:
            NotFoundException: Se a UC não existir no cadastro.
            InspectionConflictError: Se a UC já tiver ordem ativa.
            DatabaseReadError: Se as tabelas Gold não puderem ser consultadas.
        """
        registered_unit = await self.repository.fetch_registered_unit(payload.id_uc)
        if registered_unit is None:
            raise NotFoundException(f"UC {payload.id_uc} não encontrada no cadastro.")
        if await self.repository.has_active_order(payload.id_uc):
            raise ActiveOrderConflictError(payload.id_uc)
        kwh_estimado = order_estimated_kwh(registered_unit)
        return await self.repository.create_order(payload, criado_por, kwh_estimado=kwh_estimado)

    async def update_inspection(self, id_inspecao: int, payload: InspectionOrderUpdateDTO) -> InspectionOrderDTO:
        """Avança o status de uma ordem, registra o resultado de campo ou a cancela.

        Args:
            id_inspecao: Identificador da ordem.
            payload: Novo status e dados associados (resultado de campo ou justificativa).

        Returns:
            A ordem atualizada.

        Raises:
            NotFoundException: Se a ordem não existir.
            InspectionConflictError: Se a transição de status não for permitida.
            BadRequestException: Se faltarem dados obrigatórios para o novo status.
        """
        current_order = await self.repository.get_order(id_inspecao)
        if current_order is None:
            raise NotFoundException(f"Ordem de inspeção {id_inspecao} não encontrada.")
        validate_transition(current_order.status, payload)
        updated_order = await self.repository.update_order(id_inspecao, payload)
        if updated_order is None:
            raise NotFoundException(f"Ordem de inspeção {id_inspecao} não encontrada.")
        return updated_order

    async def upload_field_results(self, content: bytes, filename: str) -> UploadResultDTO:
        """Concilia a planilha preenchida em campo com as ordens ativas e conclui as que casam.

        Linhas inválidas são recusadas com motivo, sem abortar o lote; as válidas são gravadas num único commit.

        Args:
            content: Bytes do arquivo .csv ou .xlsx devolvido pela equipe de campo.
            filename: Nome original do arquivo, usado para escolher o formato.

        Returns:
            Resumo com ordens conciliadas, linhas sem resultado, linhas recusadas e kWh recuperado total.

        Raises:
            BadRequestException: Se o arquivo for de formato inválido, corrompido ou sem a coluna `id_inspecao`.
        """
        rows = await asyncio.to_thread(read_spreadsheet, content, filename)
        order_statuses = await self.repository.get_order_statuses(referenced_order_ids(rows))
        plan = reconcile_rows(rows, order_statuses)
        applied_ids = await self.repository.apply_field_results(plan.updates)
        kwh_recovered = sum(plan.updates[order_id].kwh_recuperado or 0.0 for order_id in applied_ids)
        applied_set = set(applied_ids)
        skipped_rejections = [
            RejectedRowDTO(
                aba=plan.origins[order_id].sheet,
                linha=plan.origins[order_id].line,
                id_inspecao=order_id,
                motivo=f"Ordem {order_id} deixou o fluxo de campo durante o envio e não foi alterada.",
            )
            for order_id in plan.updates
            if order_id not in applied_set
        ]
        return UploadResultDTO(
            conciliadas=len(applied_ids),
            ignoradas=plan.ignored,
            rejeitadas=[*plan.rejections, *skipped_rejections],
            kwh_recuperado_total=round(kwh_recovered, 2),
        )
