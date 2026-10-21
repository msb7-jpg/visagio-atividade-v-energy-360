"""Consultas SQLAlchemy Core portáveis sobre as tabelas Gold de cadastro, medição e inspeções.

As tabelas Gold pertencem ao pipeline (Fatias 01 e 02), por isso são declaradas com
`table()`/`column()` leves: não entram no `Base.metadata` e nunca são criadas pela API.
"""

from dataclasses import dataclass
from datetime import date, datetime

from sqlalchemy import (
    Boolean,
    CompoundSelect,
    Float,
    Select,
    String,
    Subquery,
    and_,
    case,
    column,
    func,
    or_,
    select,
    table,
    true,
)
from sqlalchemy.sql.elements import ColumnElement

from app.features.loss_management.models import ACTIVE_STATUSES, InspectionOrder
from app.features.loss_management.schemas import InspectionStatus

MESES_JANELA_RECENTE = 3
MESES_JANELA_BASE = 12
MESES_POR_ANO = 12

COMPLETED_STATUS = InspectionStatus.CONCLUIDA.value

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

fato_inspecoes_perdas = table(
    "fato_inspecoes_perdas",
    column("id_uc", String),
    column("data_inspecao", String),
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
    bairro: str | None = None
    classe: str | None = None


def shift_competencia(competencia: str, months: int) -> str:
    """Desloca uma competência em N meses, tratando a virada de ano.

    Args:
        competencia: Competência no formato 'YYYY-MM'.
        months: Quantidade de meses a deslocar (negativo volta no tempo).

    Returns:
        A competência deslocada, no formato 'YYYY-MM'.
    """
    year_text, month_text = competencia.split("-")
    original_month_index = int(year_text) * MESES_POR_ANO + int(month_text) - 1
    shifted_month_index = original_month_index + months
    shifted_year, shifted_month_zero_based = divmod(shifted_month_index, MESES_POR_ANO)
    shifted_month = shifted_month_zero_based + 1
    return f"{shifted_year:04d}-{shifted_month:02d}"


def build_windows(ultima_competencia: str) -> ConsumptionWindows:
    """Calcula as janelas recente (3 últimas competências) e base (12 anteriores a ela).

    Args:
        ultima_competencia: Competência mais recente com medição ('YYYY-MM').

    Returns:
        Início das janelas base e recente.
    """
    meses_antes_da_ultima = MESES_JANELA_RECENTE - 1
    inicio_recente = shift_competencia(ultima_competencia, -meses_antes_da_ultima)
    inicio_base = shift_competencia(inicio_recente, -MESES_JANELA_BASE)
    return ConsumptionWindows(inicio_base=inicio_base, inicio_recente=inicio_recente)


def inspection_cutoff_date(windows: ConsumptionWindows) -> date:
    """Data a partir da qual uma inspeção já verificou o sinal de queda atual.

    Args:
        windows: Janelas de análise da fila.

    Returns:
        Primeiro dia da janela base (início da janela de análise).
    """
    year_text, month_text = windows.inicio_base.split("-")
    return date(int(year_text), int(month_text), 1)


def latest_competencia_query() -> Select[str | None]:
    """Consulta a competência mais recente disponível em `fato_medicao`.

    Returns:
        SELECT que devolve a maior competência ('YYYY-MM'), ou NULL sem medições.
    """
    return select(func.max(fato_medicao.c.competencia))


def consumption_subquery(windows: ConsumptionWindows) -> Subquery:
    """Agrega o consumo por UC nas duas janelas e conta meses zerados na recente.

    Args:
        windows: Janelas base e recente.

    Returns:
        Subquery `consumo` com `id_uc`, `consumo_base_kwh`, `consumo_recente_kwh` e `meses_zerados`.
    """
    competencia = fato_medicao.c.competencia
    consumo_kwh = fato_medicao.c.consumo_kwh
    is_base = competencia < windows.inicio_recente
    is_recent = competencia >= windows.inicio_recente
    is_zero_recent = and_(is_recent, consumo_kwh == 0)
    base_consumption_kwh = case((is_base, consumo_kwh))
    recent_consumption_kwh = case((is_recent, consumo_kwh))
    zero_month_flag = case((is_zero_recent, 1), else_=0)
    return (
        select(
            fato_medicao.c.id_uc,
            func.avg(base_consumption_kwh).label("consumo_base_kwh"),
            func.avg(recent_consumption_kwh).label("consumo_recente_kwh"),
            func.sum(zero_month_flag).label("meses_zerados"),
        )
        .where(competencia >= windows.inicio_base)
        .group_by(fato_medicao.c.id_uc)
        .subquery("consumo")
    )


def _optional_filters(filters: SuspicionFilters) -> list[ColumnElement[bool]]:
    optional_conditions = [
        (filters.municipio, dim_unidade_consumidora.c.municipio),
        (filters.bairro, dim_unidade_consumidora.c.bairro),
        (filters.classe, dim_unidade_consumidora.c.classe_consumo),
    ]
    return [
        filter_column == filter_value for filter_value, filter_column in optional_conditions if filter_value is not None
    ]


def excluded_units_query(windows: ConsumptionWindows) -> CompoundSelect:
    """Lista as UCs que não podem entrar na fila.

    Saem da fila: UCs com ordem ativa e UCs inspecionadas dentro da janela de análise, seja por
    ordem concluída no sistema, seja pelo histórico de campo. Ordens canceladas não excluem.

    Args:
        windows: Janelas de análise da fila.

    Returns:
        UNION dos `id_uc` excluídos.
    """
    cutoff = inspection_cutoff_date(windows)
    cutoff_datetime = datetime.combine(cutoff, datetime.min.time())
    is_active = InspectionOrder.status.in_(ACTIVE_STATUSES)
    is_recently_completed = and_(
        InspectionOrder.status == COMPLETED_STATUS,
        InspectionOrder.atualizado_em >= cutoff_datetime,
    )
    system_orders = select(InspectionOrder.id_uc).where(or_(is_active, is_recently_completed))
    # Um único id_uc NULL faria o NOT IN avaliar UNKNOWN para todas as UCs e esvaziar a fila.
    historical_inspections = select(fato_inspecoes_perdas.c.id_uc).where(
        fato_inspecoes_perdas.c.id_uc.is_not(None),
        fato_inspecoes_perdas.c.data_inspecao >= cutoff.isoformat(),
    )
    return system_orders.union(historical_inspections)


def suspicious_profiles_query(windows: ConsumptionWindows, filters: SuspicionFilters) -> Select:
    """Monta a consulta dos perfis de consumo candidatos à fila de suspeitas.

    Candidata é a UC sem GD, sem inspeção recente, com queda acima do limiar ou leitura zerada.

    Args:
        windows: Janelas base e recente.
        filters: Limiar de queda e filtros opcionais de município, bairro e classe.

    Returns:
        SELECT com cadastro e consumo agregado das UCs candidatas.
    """
    consumo = consumption_subquery(windows)
    uc = dim_unidade_consumidora
    excluded_units = excluded_units_query(windows)
    remaining_share = 1 - filters.limiar_queda
    drop_ceiling_kwh = consumo.c.consumo_base_kwh * remaining_share
    has_sudden_drop = consumo.c.consumo_recente_kwh <= drop_ceiling_kwh
    has_zero_reading = consumo.c.meses_zerados > 0
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
            has_sudden_drop | has_zero_reading,
            uc.c.id_uc.not_in(excluded_units),
            *_optional_filters(filters),
        )
    )
