"""Plano de conciliação da planilha de campo: lê o arquivo e valida cada linha contra as ordens reais, sem gravar."""

import asyncio

from app.features.loss_management.repository import LossRepository
from app.features.loss_management.upload_parser import read_spreadsheet
from app.features.loss_management.upload_reconcile import (
    ReconciliationPlan,
    reconcile_rows,
    referenced_order_ids,
    referenced_unit_ids,
)


async def build_upload_plan(repository: LossRepository, content: bytes, filename: str) -> ReconciliationPlan:
    """Lê a planilha e decide, linha a linha, o que seria gravado e o que seria recusado.

    Serve tanto à importação quanto à pré-visualização (`dry_run`): a validação é a mesma, só a gravação muda.

    Args:
        repository: Repositório que informa as ordens ativas e o status das ordens citadas.
        content: Bytes do arquivo .csv ou .xlsx devolvido pela equipe de campo.
        filename: Nome original do arquivo, usado para escolher o formato.

    Returns:
        O plano de conciliação, sem nada gravado.

    Raises:
        BadRequestException: Se o arquivo for de formato inválido, corrompido ou sem a coluna `id_inspecao`.
    """
    rows = await asyncio.to_thread(read_spreadsheet, content, filename)
    active_order_by_uc = await repository.get_active_order_ids_by_uc(referenced_unit_ids(rows))
    order_ids = referenced_order_ids(rows) | set(active_order_by_uc.values())
    order_statuses = await repository.get_order_statuses(order_ids)
    return reconcile_rows(rows, order_statuses, active_order_by_uc)
