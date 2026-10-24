"""Consultas SQLAlchemy Core portáveis sobre as tabelas Gold de faturamento e cadastro.

As tabelas Gold pertencem ao pipeline (Fatias 01 e 02), por isso são declaradas com `table()`/`column()` leves:
não entram no `Base.metadata` e nunca são criadas pela API. Só os filtros preenchidos entram no `WHERE`, então o
SQL é gerado pelo dialeto do banco e nenhum parâmetro chega ao servidor como NULL sem tipo.
"""
# pylint: disable=not-callable
from sqlalchemy import Float, Select, String, case, column, distinct, func, or_, select, table
from sqlalchemy.sql.elements import ColumnElement

from app.features.revenue.schemas import PeriodWindow, RevenueFilters

fato_faturamento = table(
    "fato_faturamento",
    column("id_uc", String),
    column("competencia", String),
    column("valor_total_rs", Float),
    column("consumo_faturado_kwh", Float),
)

dim_unidade_consumidora = table(
    "dim_unidade_consumidora",
    column("id_uc", String),
    column("classe_consumo", String),
    column("municipio", String),
    column("bairro", String),
)

faturas_com_cadastro = fato_faturamento.join(
    dim_unidade_consumidora, dim_unidade_consumidora.c.id_uc == fato_faturamento.c.id_uc
)


def in_window(window: PeriodWindow) -> ColumnElement[bool]:
    """Condição: a fatura pertence a uma competência da janela (limites incluídos)."""
    return fato_faturamento.c.competencia.between(window.competencia_inicio, window.competencia_fim)


def window_sum(metric: ColumnElement[float], window: PeriodWindow) -> ColumnElement[float]:
    """Soma da métrica só nas faturas da janela (zero quando não há nenhuma)."""
    return func.coalesce(func.sum(case((in_window(window), metric))), 0)


def optional_conditions(filters: RevenueFilters) -> list[ColumnElement[bool]]:
    """Condições de município, bairro e classe, apenas para os filtros preenchidos."""
    candidates = [
        (filters.municipio, dim_unidade_consumidora.c.municipio),
        (filters.bairro, dim_unidade_consumidora.c.bairro),
        (filters.classe_consumo, dim_unidade_consumidora.c.classe_consumo),
    ]
    return [filter_column == filter_value for filter_value, filter_column in candidates if filter_value is not None]


def segment_totals_query(base: PeriodWindow, current: PeriodWindow, filters: RevenueFilters) -> Select:
    """Volume e receita por classe, município e bairro nas janelas base e atual."""
    uc = dim_unidade_consumidora
    volume = fato_faturamento.c.consumo_faturado_kwh
    revenue = fato_faturamento.c.valor_total_rs
    return (
        select(
            uc.c.classe_consumo,
            uc.c.municipio,
            uc.c.bairro,
            window_sum(volume, base).label("volume_base_kwh"),
            window_sum(revenue, base).label("receita_base_rs"),
            window_sum(volume, current).label("volume_atual_kwh"),
            window_sum(revenue, current).label("receita_atual_rs"),
        )
        .select_from(faturas_com_cadastro)
        .where(or_(in_window(base), in_window(current)), *optional_conditions(filters))
        .group_by(uc.c.classe_consumo, uc.c.municipio, uc.c.bairro)
        .order_by(uc.c.municipio, uc.c.bairro, uc.c.classe_consumo)
    )


def period_totals_query(base: PeriodWindow, current: PeriodWindow, filters: RevenueFilters) -> Select:
    """Receita, volume, número de faturas e UCs distintas nas janelas base e atual (uma linha)."""
    volume = fato_faturamento.c.consumo_faturado_kwh
    revenue = fato_faturamento.c.valor_total_rs
    id_uc = fato_faturamento.c.id_uc
    return (
        select(
            window_sum(revenue, base).label("receita_base_rs"),
            window_sum(volume, base).label("volume_base_kwh"),
            func.count(case((in_window(base), 1))).label("faturas_base"),
            func.count(distinct(case((in_window(base), id_uc)))).label("ucs_base"),
            window_sum(revenue, current).label("receita_atual_rs"),
            window_sum(volume, current).label("volume_atual_kwh"),
            func.count(case((in_window(current), 1))).label("faturas_atual"),
            func.count(distinct(case((in_window(current), id_uc)))).label("ucs_atual"),
        )
        .select_from(faturas_com_cadastro)
        .where(or_(in_window(base), in_window(current)), *optional_conditions(filters))
    )


def monthly_totals_query(window: PeriodWindow, filters: RevenueFilters) -> Select:
    """Volume e receita por competência na janela, já filtrados por município, bairro e classe."""
    competencia = fato_faturamento.c.competencia
    return (
        select(
            competencia,
            func.coalesce(func.sum(fato_faturamento.c.consumo_faturado_kwh), 0).label("volume_kwh"),
            func.coalesce(func.sum(fato_faturamento.c.valor_total_rs), 0).label("receita_rs"),
        )
        .select_from(faturas_com_cadastro)
        .where(in_window(window), *optional_conditions(filters))
        .group_by(competencia)
        .order_by(competencia)
    )