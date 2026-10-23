"""Exceções de domínio da Visão 360 da Unidade Consumidora."""

from app.shared.exceptions import NotFoundException


class CustomerNotFoundError(NotFoundException):
    """A UC buscada pelo atendente não existe no cadastro."""

    def __init__(self, id_uc: str):
        super().__init__(f"Unidade Consumidora '{id_uc}' não encontrada.")
