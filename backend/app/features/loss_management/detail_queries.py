"""Consultas do detalhe de uma UC: sempre filtradas por `id_uc` (e período), nunca varrem a tabela inteira."""

from sqlalchemy import Select, func, select

from app.features.loss_management.models import InspectionOrder
from app.features.loss_management.queries import COMPLETED_STATUS, fato_inspecoes_perdas, fato_medicao

MAX_PRIOR_INSPECTIONS = 20


def monthly_consumption_query(id_uc: str, first_competencia: str, last_competencia: str) -> Select:
    """Consumo mensal da UC no período, pelo índice `idx_fato_med_uc`.

    Leitura negativa é inválida (D5) e fica de fora, como na fila: o mês aparece sem consumo. Leitura zero é
    válida e é devolvida.

    Args:
        id_uc: Unidade consumidora.
        first_competencia: Primeira competência do período ('YYYY-MM'), inclusive.
        last_competencia: Última competência do período ('YYYY-MM'), inclusive.

    Returns:
        SELECT com `competencia` e `consumo_kwh`, uma linha por mês com leitura válida.
    """
    competencia = fato_medicao.c.competencia
    consumo_kwh = fato_medicao.c.consumo_kwh
    return (
        select(competencia, func.sum(consumo_kwh).label("consumo_kwh"))
        .where(
            fato_medicao.c.id_uc == id_uc,
            competencia >= first_competencia,
            competencia <= last_competencia,
            consumo_kwh >= 0,
        )
        .group_by(competencia)
    )


def field_inspections_query(id_uc: str, history_until: str | None) -> Select:
    """Inspeções de campo da UC no histórico Gold (`fato_inspecoes_perdas`), pelo índice por UC.

    Args:
        id_uc: Unidade consumidora.
        history_until: Data ISO (exclusiva) em que o histórico deixa de valer, se a análise está fixada no passado.

    Returns:
        SELECT com data, resultado e inspetor, da mais recente para a mais antiga.
    """
    inspection = fato_inspecoes_perdas.c
    until_condition = [inspection.data_inspecao < history_until] if history_until else []
    return (
        select(inspection.data_inspecao, inspection.irregularidade_constatada, inspection.id_inspetor)
        .where(inspection.id_uc == id_uc, *until_condition)
        .order_by(inspection.data_inspecao.desc())
        .limit(MAX_PRIOR_INSPECTIONS)
    )


def completed_orders_query(id_uc: str) -> Select:
    """Ordens da UC concluídas no portal, pelo índice por UC; cancelada não é inspeção.

    Args:
        id_uc: Unidade consumidora.

    Returns:
        SELECT com data, resultado e inspetor registrados na conclusão.
    """
    return (
        select(InspectionOrder.data_inspecao, InspectionOrder.irregularidade_constatada, InspectionOrder.inspetor)
        .where(InspectionOrder.id_uc == id_uc, InspectionOrder.status == COMPLETED_STATUS)
        .order_by(InspectionOrder.atualizado_em.desc())
        .limit(MAX_PRIOR_INSPECTIONS)
    )
