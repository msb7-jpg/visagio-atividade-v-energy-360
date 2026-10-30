"""Consultas SQLAlchemy Core das áreas do Painel do Diretor sobre as tabelas Gold.

Cada consulta devolve uma linha com cada métrica duas vezes: `<métrica>_base` e `<métrica>_atual`. Sem `WHERE` por
competência: cada métrica filtra a janela no `CASE`, o que é mais rápido no SQLite (ADR-016).
"""
# pylint: disable=not-callable
from collections.abc import Callable

from sqlalchemy import Float, Select, String, and_, case, column, func, select, table
from sqlalchemy.sql.elements import ColumnElement

from app.features.revenue.schemas import PeriodWindow

COMPETENCIA_LENGTH = len("YYYY-MM")
STATUS_VENCIDA = "VENCIDA"
LEITURA_ESTIMADA = "ESTIMADA"
SUFFIX_BASE = "base"
SUFFIX_ATUAL = "atual"

fato_faturamento = table(
    "fato_faturamento",
    column("competencia", String),
    column("valor_total_rs", Float),
    column("status_pagamento", String),
)

fato_ocorrencias_rede = table(
    "fato_ocorrencias_rede",
    column("competencia", String),
    column("duracao_horas", Float),
)

fato_atendimentos = table(
    "fato_atendimentos",
    column("data_abertura", String),
    column("nota_csat", Float),
    column("tempo_resolucao_horas", Float),
)

fato_medicao = table(
    "fato_medicao",
    column("competencia", String),
    column("tipo_leitura", String),
)

dim_unidade_consumidora = table(
    "dim_unidade_consumidora",
    column("id_uc", String),
    column("data_conexao_gd", String),
)

WindowMetric = Callable[[PeriodWindow], ColumnElement]


def in_window(competencia: ColumnElement[str], window: PeriodWindow) -> ColumnElement[bool]:
    """Condição: a competência pertence à janela (limites incluídos)."""
    return competencia.between(window.competencia_inicio, window.competencia_fim)


def _next_competencia(competencia: str) -> str:
    """Retorna a competência seguinte, tratando a virada de ano."""
    year_text, month_text = competencia.split("-")
    next_year, next_month_zero_based = divmod(int(year_text) * 12 + int(month_text), 12)
    return f"{next_year:04d}-{next_month_zero_based + 1:02d}"


def _service_window(data_abertura: ColumnElement[str], window: PeriodWindow) -> ColumnElement[bool]:
    """Filtra datas ISO pelo intervalo semiaberto correspondente às competências."""
    first_day = f"{window.competencia_inicio}-01"
    first_day_after_window = f"{_next_competencia(window.competencia_fim)}-01"
    return and_(data_abertura >= first_day, data_abertura < first_day_after_window)


def paired_columns(metrics: dict[str, WindowMetric], base: PeriodWindow, current: PeriodWindow) -> list:
    """Calcula cada métrica nas duas janelas, com os rótulos `<métrica>_base` e `<métrica>_atual`."""
    windows = ((SUFFIX_BASE, base), (SUFFIX_ATUAL, current))
    return [
        metric(window).label(f"{metric_name}_{suffix}")
        for metric_name, metric in metrics.items()
        for suffix, window in windows
    ]


def billing_query(base: PeriodWindow, current: PeriodWindow) -> Select:
    """Valor faturado e valor vencido sem pagamento nas duas janelas."""
    competencia = fato_faturamento.c.competencia
    valor = fato_faturamento.c.valor_total_rs
    overdue = fato_faturamento.c.status_pagamento == STATUS_VENCIDA
    metrics: dict[str, WindowMetric] = {
        "valor_faturado_rs": lambda window: func.coalesce(func.sum(case((in_window(competencia, window), valor))), 0),
        "valor_vencido_rs": lambda window: func.coalesce(
            func.sum(case((in_window(competencia, window) & overdue, valor))), 0
        ),
    }
    return select(*paired_columns(metrics, base, current))


def outages_query(base: PeriodWindow, current: PeriodWindow) -> Select:
    """Interrupções (uma linha por UC atingida) e horas sem energia somadas nas duas janelas."""
    competencia = fato_ocorrencias_rede.c.competencia
    duracao = fato_ocorrencias_rede.c.duracao_horas
    metrics: dict[str, WindowMetric] = {
        "interrupcoes": lambda window: func.count(case((in_window(competencia, window), 1))),
        "horas_interrompidas": lambda window: func.coalesce(
            func.sum(case((in_window(competencia, window), duracao))), 0
        ),
    }
    return select(*paired_columns(metrics, base, current))


def service_query(base: PeriodWindow, current: PeriodWindow) -> Select:
    """Nota média de satisfação e tempo médio de resolução dos chamados abertos nas duas janelas.

    A média do SQL ignora as notas vazias (chamado sem pesquisa respondida).
    """
    data_abertura = fato_atendimentos.c.data_abertura
    metrics: dict[str, WindowMetric] = {
        "nota_media_csat": lambda window: func.avg(
            case((_service_window(data_abertura, window), fato_atendimentos.c.nota_csat))
        ),
        "tempo_medio_resolucao_h": lambda window: func.avg(
            case((_service_window(data_abertura, window), fato_atendimentos.c.tempo_resolucao_horas))
        ),
    }
    return select(*paired_columns(metrics, base, current))


def readings_query(base: PeriodWindow, current: PeriodWindow) -> Select:
    """Leituras feitas e leituras estimadas (sem acesso ao medidor) nas duas janelas."""
    competencia = fato_medicao.c.competencia
    estimated = fato_medicao.c.tipo_leitura == LEITURA_ESTIMADA
    metrics: dict[str, WindowMetric] = {
        "leituras": lambda window: func.count(case((in_window(competencia, window), 1))),
        "leituras_estimadas": lambda window: func.count(case((in_window(competencia, window) & estimated, 1))),
    }
    return select(*paired_columns(metrics, base, current))


def solar_query(base: PeriodWindow, current: PeriodWindow) -> Select:
    """UCs com painel solar ligado até o fim de cada janela."""
    connected_month = func.substr(dim_unidade_consumidora.c.data_conexao_gd, 1, COMPETENCIA_LENGTH)
    metrics: dict[str, WindowMetric] = {
        "ucs_com_gd": lambda window: func.count(case((connected_month <= window.competencia_fim, 1))),
    }
    return select(*paired_columns(metrics, base, current)).where(
        dim_unidade_consumidora.c.data_conexao_gd.is_not(None)
    )


def available_period_query() -> Select:
    """Primeira e última competência com faturamento."""
    competencia = fato_faturamento.c.competencia
    return select(func.min(competencia).label("inicio"), func.max(competencia).label("fim"))


AREA_QUERIES: dict[str, Callable[[PeriodWindow, PeriodWindow], Select]] = {
    "fato_faturamento": billing_query,
    "fato_ocorrencias_rede": outages_query,
    "fato_atendimentos": service_query,
    "fato_medicao": readings_query,
    "dim_unidade_consumidora": solar_query,
}
