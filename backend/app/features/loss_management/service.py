"""Regras de negócio da fila de suspeitas e do ciclo de vida das ordens de inspeção."""

from app.features.loss_management.exceptions import ActiveOrderConflictError, InspectionConflictError
from app.features.loss_management.queries import SuspicionFilters
from app.features.loss_management.repository import LossRepository
from app.features.loss_management.schemas import (
    InspectionOrderCreateDTO,
    InspectionOrderDTO,
    InspectionOrderUpdateDTO,
    InspectionStatus,
    SuspiciousUnitDTO,
    SuspiciousUnitsFilterDTO,
)
from app.features.loss_management.scoring import LIMIAR_QUEDA_SUBITA, rank_suspicious_units
from app.shared.exceptions import BadRequestException, NotFoundException

ALLOWED_TRANSITIONS: dict[InspectionStatus, frozenset[InspectionStatus]] = {
    InspectionStatus.GERADA: frozenset({InspectionStatus.PENDENTE, InspectionStatus.CANCELADA}),
    InspectionStatus.PENDENTE: frozenset({InspectionStatus.CONCLUIDA, InspectionStatus.CANCELADA}),
    InspectionStatus.CONCLUIDA: frozenset(),
    InspectionStatus.CANCELADA: frozenset(),
}

IRREGULARITY_DETAIL_FIELDS = frozenset({"tipo_irregularidade", "kwh_recuperado", "numero_toi"})

FIELDS_BY_TARGET_STATUS: dict[InspectionStatus, frozenset[str]] = {
    InspectionStatus.PENDENTE: frozenset({"fiscal_responsavel"}),
    InspectionStatus.CONCLUIDA: frozenset({"fiscal_responsavel", "irregularidade_constatada"})
    | IRREGULARITY_DETAIL_FIELDS,
    InspectionStatus.CANCELADA: frozenset({"justificativa_cancelamento"}),
}


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


def ensure_required_fields(payload: InspectionOrderUpdateDTO) -> None:
    """Exige o resultado de campo na conclusão e a justificativa no cancelamento.

    Args:
        payload: Alteração solicitada.

    Raises:
        BadRequestException: Se faltar o resultado de campo ou a justificativa.
    """
    if payload.status == InspectionStatus.CONCLUIDA and payload.irregularidade_constatada is None:
        raise BadRequestException("Informe se houve irregularidade constatada para concluir a ordem.")
    justification_text = (payload.justificativa_cancelamento or "").strip()
    if payload.status == InspectionStatus.CANCELADA and not justification_text:
        raise BadRequestException("Justificativa é obrigatória para cancelar a ordem.")


def ensure_fields_match_status(payload: InspectionOrderUpdateDTO) -> None:
    """Rejeita campos que não pertencem ao status de destino.

    Detalhes da irregularidade (tipo, kWh recuperado, TOI) só valem quando ela foi constatada.

    Args:
        payload: Alteração solicitada.

    Raises:
        BadRequestException: Se vierem campos incompatíveis com o status ou com o resultado de campo.
    """
    informed_fields = payload.model_dump(exclude_none=True, exclude={"status"}).keys()
    allowed_fields = FIELDS_BY_TARGET_STATUS.get(payload.status, frozenset())
    unexpected_fields = sorted(informed_fields - allowed_fields)
    if unexpected_fields:
        raise BadRequestException(
            f"Campos não aceitos para o status '{payload.status}': {', '.join(unexpected_fields)}."
        )
    misplaced_details = sorted(informed_fields & IRREGULARITY_DETAIL_FIELDS)
    if payload.irregularidade_constatada is False and misplaced_details:
        raise BadRequestException(
            f"Sem irregularidade constatada, não informe: {', '.join(misplaced_details)}."
        )


class LossService:
    """Orquestra a priorização de suspeitas e a gestão das ordens de inspeção."""

    def __init__(self, repository: LossRepository) -> None:
        self.repository = repository

    async def list_suspicious_units(self, queue_filter: SuspiciousUnitsFilterDTO) -> list[SuspiciousUnitDTO]:
        """Monta a fila de UCs suspeitas priorizada por valor esperado de recuperação.

        Args:
            queue_filter: Filtros de município, bairro e classe e o tamanho da fila.

        Returns:
            UCs suspeitas em ordem decrescente de valor esperado, limitadas a `queue_filter.limit`.

        Raises:
            DatabaseReadError: Se as tabelas Gold não puderem ser consultadas.
        """
        filters = SuspicionFilters(
            limiar_queda=LIMIAR_QUEDA_SUBITA,
            municipio=queue_filter.municipio,
            bairro=queue_filter.bairro,
            classe=queue_filter.classe,
        )
        profiles = await self.repository.fetch_consumption_profiles(filters)
        return rank_suspicious_units(profiles, queue_filter.limit)

    async def list_inspections(self, status: InspectionStatus | None) -> list[InspectionOrderDTO]:
        """Lista as ordens de inspeção, opcionalmente filtradas por status.

        Args:
            status: Status para filtrar; None devolve todas.

        Returns:
            Ordens da mais recente para a mais antiga.
        """
        return await self.repository.list_orders(status)

    async def create_inspection(self, payload: InspectionOrderCreateDTO, criado_por: str) -> InspectionOrderDTO:
        """Gera uma ordem de inspeção a partir da fila.

        Args:
            payload: UC, motivo e kWh estimado da ordem.
            criado_por: E-mail do usuário que gerou a ordem.

        Returns:
            A ordem criada com status `gerada`.

        Raises:
            InspectionConflictError: Se a UC já tiver ordem ativa.
        """
        if await self.repository.has_active_order(payload.id_uc):
            raise ActiveOrderConflictError(payload.id_uc)
        return await self.repository.create_order(payload, criado_por)

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
