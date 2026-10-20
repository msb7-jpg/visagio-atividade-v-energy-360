"""Consultas SQLAlchemy Core portáveis sobre as tabelas Gold de cadastro e medição.

As tabelas Gold pertencem ao pipeline (Fatia 01), por isso são declaradas com
`table()`/`column()` leves: não entram no `Base.metadata` e nunca são criadas pela API.
"""

from dataclasses import dataclass

from sqlalchemy import Boolean, Float, Select, String, Subquery, and_, case, column, func, select, table, true
from sqlalchemy.sql.elements import ColumnElement

from app.features.loss_management.models import InspectionOrder
from app.features.loss_management.schemas import InspectionStatus

MESES_JANELA_RECENTE = 3
MESES_JANELA_BASE = 12
MESES_POR_ANO = 12

ACTIVE_STATUSES = (InspectionStatus.GERADA.value, InspectionStatus.PENDENTE.value)

fato_medicao = table(
    "fato_medicao",
    column("id_uc", String),
    column("competencia", String),
    column("consumo_kwh", Float),
)

dim_unidade_consumidora = table(
    "dim_unidade_consumidora",
    column("id_uc", String),
    column("municipio", String),
    column("bairro", String),
    column("classe_consumo", String),
    column("possui_gd", Boolean),
)


@dataclass(frozen=True, slots=True)
class ConsumptionWindows:
    """Competências ('YYYY-MM') que delimitam a janela base e a janela recente."""

    inicio_base: str
    inicio_recente: str


@dataclass(frozen=True, slots=True)
class SuspicionFilters:
    """Critérios da fila: limiar de queda e filtros opcionais da tela."""

    limiar_queda: float
    municipio: str | None = None
    classe: str | None = None


def shift_competencia(competencia: str, months: int) -> str:
    """Desloca uma competência 'YYYY-MM' em N meses (negativo volta no tempo)."""
    year_text, month_text = competencia.split("-")
    month_index = int(year_text) * MESES_POR_ANO + int(month_text) - 1 + months
    shifted_year, shifted_month_zero_based = divmod(month_index, MESES_POR_ANO)
    return f"{shifted_year:04d}-{shifted_month_zero_based + 1:02d}"


def build_windows(ultima_competencia: str) -> ConsumptionWindows:
    """Janela recente = 3 últimas competências; base = 12 competências anteriores a ela."""
    inicio_recente = shift_competencia(ultima_competencia, -(MESES_JANELA_RECENTE - 1))
    return ConsumptionWindows(
        inicio_base=shift_competencia(inicio_recente, -MESES_JANELA_BASE),
        inicio_recente=inicio_recente,
    )


def latest_competencia_query() -> Select[str | None]:
    return select(func.max(fato_medicao.c.competencia))


def consumption_subquery(windows: ConsumptionWindows) -> Subquery:
    """Consumo médio por UC nas duas janelas e contagem de meses zerados na recente."""
    competencia = fato_medicao.c.competencia
    consumo_kwh = fato_medicao.c.consumo_kwh
    is_recent = competencia >= windows.inicio_recente
    is_zero_recent = and_(is_recent, consumo_kwh == 0)
    return (
        select(
            fato_medicao.c.id_uc,
            func.avg(case((competencia < windows.inicio_recente, consumo_kwh))).label("consumo_base_kwh"),
            func.avg(case((is_recent, consumo_kwh))).label("consumo_recente_kwh"),
            func.sum(case((is_zero_recent, 1), else_=0)).label("meses_zerados"),
        )
        .where(competencia >= windows.inicio_base)
        .group_by(fato_medicao.c.id_uc)
        .subquery("consumo")
    )


def _optional_filters(filters: SuspicionFilters) -> list[ColumnElement[bool]]:
    optional_conditions = [
        (filters.municipio, dim_unidade_consumidora.c.municipio),
        (filters.classe, dim_unidade_consumidora.c.classe_consumo),
    ]
    return [
        filter_column == filter_value for filter_value, filter_column in optional_conditions if filter_value is not None
    ]


def suspicious_profiles_query(windows: ConsumptionWindows, filters: SuspicionFilters) -> Select:
    """Perfis de consumo candidatos à fila de suspeitas (sem GD e sem ordem ativa)."""
    consumo = consumption_subquery(windows)
    uc = dim_unidade_consumidora
    active_orders = select(InspectionOrder.id_uc).where(InspectionOrder.status.in_(ACTIVE_STATUSES))
    has_sudden_drop = consumo.c.consumo_recente_kwh <= consumo.c.consumo_base_kwh * (1 - filters.limiar_queda)
    return (
        select(
            uc.c.id_uc, uc.c.municipio, uc.c.bairro, uc.c.classe_consumo,
            consumo.c.consumo_base_kwh, consumo.c.consumo_recente_kwh, consumo.c.meses_zerados,
        )
        .join_from(consumo, uc, uc.c.id_uc == consumo.c.id_uc)
        .where(
            uc.c.possui_gd.is_not(true()),
            consumo.c.consumo_base_kwh > 0,
            consumo.c.consumo_recente_kwh.is_not(None),
            has_sudden_drop | (consumo.c.meses_zerados > 0),
            uc.c.id_uc.not_in(active_orders),
            *_optional_filters(filters),
        )
    )
