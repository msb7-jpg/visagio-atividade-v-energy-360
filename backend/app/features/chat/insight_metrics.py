"""Métricas do insight calculadas no servidor: o texto da IA só pode citar números que vieram do banco."""

import re
from collections.abc import Mapping

from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.features.auth.schemas import UserDTO
from app.features.customer360.dependencies import get_customer360_service
from app.features.customer360.schemas import CustomerEventTimelineDTO, CustomerHistoryDTO, CustomerSummaryDTO
from app.features.executive_dashboard.dependencies import (
    ATUAL_FIM_PADRAO,
    ATUAL_INICIO_PADRAO,
    BASE_FIM_PADRAO,
    BASE_INICIO_PADRAO,
    get_executive_dashboard_service,
)
from app.features.executive_dashboard.schemas import DashboardIndicatorsDTO
from app.features.revenue.schemas import PeriodWindow
from app.shared.exceptions import BadRequestException, ForbiddenException
from app.shared.role_groups import CUSTOMER360_ACCESS, DIRETORIA_ONLY

InsightMetrics = dict[str, float | int | str]

WINDOW_TEXT = re.compile(r"^(\d{4}-\d{2}) a (\d{4}-\d{2})$")
DIAGNOSIS_FIELDS = {
    "competencia_referencia": "competencia_referencia",
    "consumo_kwh_mes": "consumo_kwh",
    "consumo_kwh_mesmo_mes_ano_anterior": "consumo_kwh_ano_anterior",
    "variacao_consumo_pct": "variacao_consumo_pct",
    "tendencia_consumo": "tendencia_consumo",
    "variacao_tarifa_pct": "variacao_tarifa_pct",
    "bandeira_atual": "bandeira_atual",
    "bandeira_ano_anterior": "bandeira_ano_anterior",
    "dias_faturamento": "dias_faturamento",
    "dias_faturamento_ano_anterior": "dias_faturamento_ano_anterior",
    "leitura_estimada": "leitura_estimada",
}
TOTALS_FIELDS = {
    "consumo_12_meses_kwh": "consumo_kwh",
    "consumo_12_meses_ano_anterior_kwh": "consumo_kwh_ano_anterior",
    "variacao_consumo_12_meses_pct": "variacao_consumo_pct",
}


def _metric_value(value: object) -> float | int | str | None:
    if isinstance(value, bool):
        return "sim" if value else "não"
    if value is None or isinstance(value, int | float | str):
        return value
    return str(value)


def _copy_fields(metrics: InsightMetrics, source: object | None, fields: Mapping[str, str]) -> None:
    if source is None:
        return
    for metric_name, attribute in fields.items():
        value = _metric_value(getattr(source, attribute, None))
        if value is not None:
            metrics[metric_name] = value


def customer_metrics(
    summary: CustomerSummaryDTO, history: CustomerHistoryDTO, events: CustomerEventTimelineDTO
) -> InsightMetrics:
    """Mesmas métricas que a Visão 360 mostra (`buildCustomerInsightMetrics` no frontend), lidas do banco."""
    metrics: InsightMetrics = {
        "faturas_em_aberto": len(history.faturas_em_aberto),
        "valor_em_aberto_rs": history.valor_em_aberto_rs,
        "interrupcoes_da_uc": events.resumo_interrupcoes_uc.total_interrupcoes,
        "horas_sem_energia_da_uc": events.resumo_interrupcoes_uc.total_horas,
        "chamados": len(events.chamados),
        "inspecoes_de_perdas": len(events.inspecoes),
        "possui_painel_solar": "sim" if summary.possui_gd else "não",
    }
    _copy_fields(metrics, history.diagnostico, DIAGNOSIS_FIELDS)
    _copy_fields(metrics, history.resumo_12_meses, TOTALS_FIELDS)
    return metrics


def dashboard_metrics(indicators: DashboardIndicatorsDTO) -> InsightMetrics:
    """Mesmas métricas que o Painel mostra (`extractMetricsFromGroups` no frontend), lidas do banco."""
    metrics: InsightMetrics = {}
    for group in indicators.grupos:
        for indicator in group.indicadores:
            for suffix, value in (
                ("atual", indicator.atual),
                ("base", indicator.base),
                ("var_pct", indicator.variacao_pct),
                ("var_pp", indicator.variacao_pp),
            ):
                if value is not None:
                    metrics[f"{indicator.id}_{suffix}"] = value
    return metrics


def _window(text: object, default_start: str, default_end: str) -> PeriodWindow:
    match = WINDOW_TEXT.match(str(text)) if text else None
    start, end = match.groups() if match else (default_start, default_end)
    try:
        return PeriodWindow(competencia_inicio=start, competencia_fim=end)
    except ValidationError as error:
        raise BadRequestException(f"Período inválido para o insight: {text}") from error


def _ensure_role(user: UserDTO, allowed_roles: tuple, screen: str) -> None:
    if user.role not in {role.value for role in allowed_roles}:
        raise ForbiddenException(f"O perfil '{user.role}' não acessa os dados da tela '{screen}'.")


async def server_metrics(
    context: str, filters: Mapping[str, object], user: UserDTO, session: AsyncSession, settings: Settings
) -> InsightMetrics:
    """Recalcula no banco as métricas da tela, com o mesmo controle de acesso da tela.

    Args:
        context: Tela que pediu o insight (`executive` ou `customer360`).
        filters: Filtros da tela: períodos do Painel (`base`, `atual`) ou a UC da Visão 360 (`id_uc`).
        user: Usuário autenticado.
        session: Sessão do banco.
        settings: Configuração da aplicação (competência de referência da fila).

    Returns:
        As métricas da tela, calculadas pelo servidor.

    Raises:
        BadRequestException: Se a tela não tem insight ou faltam os filtros dela.
        ForbiddenException: Se o perfil não acessa a tela.
    """
    if context == "executive":
        _ensure_role(user, DIRETORIA_ONLY, context)
        base = _window(filters.get("base"), BASE_INICIO_PADRAO, BASE_FIM_PADRAO)
        current = _window(filters.get("atual"), ATUAL_INICIO_PADRAO, ATUAL_FIM_PADRAO)
        service = get_executive_dashboard_service(session, settings)
        return dashboard_metrics(await service.get_indicators(base, current))
    if context == "customer360":
        _ensure_role(user, CUSTOMER360_ACCESS, context)
        id_uc = filters.get("id_uc")
        if not id_uc:
            raise BadRequestException("Informe a UC (`id_uc`) para o insight da Visão 360.")
        service = get_customer360_service(session)
        summary = await service.get_summary(str(id_uc))
        history = await service.get_history(summary.id_uc)
        return customer_metrics(summary, history, await service.get_events(summary.id_uc))
    raise BadRequestException(f"A tela '{context}' não tem insight de IA.")
