"""Consulta da trilha de auditoria de uma ordem de inspeção."""

from app.features.loss_management.order_events import OrderEventDTO
from app.features.loss_management.repository import LossRepository
from app.shared.exceptions import NotFoundException


class OrderEventService:
    """Mostra o histórico real de uma ordem; nunca monta histórico sintético."""

    def __init__(self, repository: LossRepository) -> None:
        self.repository = repository

    async def list_events(self, id_inspecao: int) -> list[OrderEventDTO]:
        """Lista a trilha de auditoria da ordem, do primeiro passo ao mais recente.

        Args:
            id_inspecao: Identificador da ordem.

        Returns:
            Os eventos gravados; vazio para ordens anteriores à trilha de auditoria.

        Raises:
            NotFoundException: Se a ordem não existir.
        """
        if await self.repository.get_order(id_inspecao) is None:
            raise NotFoundException(f"Ordem de inspeção {id_inspecao} não encontrada.")
        return await self.repository.list_order_events(id_inspecao)
