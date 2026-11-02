"""Consulta da fila de suspeitas: UCs candidatas por queda de consumo, descontadas as já inspecionadas."""

from datetime import date, datetime, timedelta

from sqlalchemy import CompoundSelect, Select, Subquery, and_, or_, select, true, union
from sqlalchemy.sql.elements import ColumnElement

from app.features.loss_management.models import InspectionOrder
from app.features.loss_management.queries import (
    COMPLETED_STATUS,
    ConsumptionWindows,
    SuspicionFilters,
    competencia_first_day,
    consumption_subquery,
    dim_unidade_consumidora,
    fato_inspecoes_perdas,
    inspection_cutoff_date,
    reincidence_cutoff_date,
)
from app.features.loss_management.schemas import CancellationReason, InspectionStatus
from app.features.loss_management.scoring import LIMIAR_QUEDA_SUBITA

CANCELLATION_BLOCK_DAYS = 90
BLOCKING_CANCELLATION_REASONS = (CancellationReason.CLIENTE_REGULARIZOU, CancellationReason.ENDERECO_NAO_LOCALIZADO)


def _optional_filters(filters: SuspicionFilters) -> list[ColumnElement[bool]]:
    optional_conditions = [
        (filters.municipio, dim_unidade_consumidora.c.municipio),
        (filters.bairro, dim_unidade_consumidora.c.bairro),
        (filters.classe, dim_unidade_consumidora.c.classe_consumo),
    ]
    return [
        filter_column == filter_value for filter_value, filter_column in optional_conditions if filter_value is not None
    ]


def _system_orders_query(cutoff: date, *, irregular: bool) -> Select:
    """UCs com ordem concluída desde `cutoff` no sistema, com ou sem irregularidade constatada.

    Ordens ativas não excluem: a UC segue na fila, marcada com a situação da ordem.
    """
    cutoff_datetime = datetime.combine(cutoff, datetime.min.time())
    return select(InspectionOrder.id_uc).where(
        InspectionOrder.status == COMPLETED_STATUS,
        InspectionOrder.atualizado_em >= cutoff_datetime,
        _irregularity_condition(InspectionOrder.irregularidade_constatada, irregular=irregular),
    )


def _irregularity_condition(column: ColumnElement[bool], *, irregular: bool) -> ColumnElement[bool]:
    """Inspeção com irregularidade constatada, ou sem ela (inclui o resultado ainda não informado)."""
    return column.is_(true()) if irregular else column.is_not(true())


def _blocking_cancellations_query() -> Select:
    """UCs cuja ordem foi cancelada por um motivo que torna inútil uma nova visita agora.

    O cliente já regularizou, ou o endereço não foi localizado e outra ordem falharia do mesmo jeito. A UC fica
    fora da fila por `CANCELLATION_BLOCK_DAYS`; os demais motivos devolvem a UC à fila na hora.
    """
    blocked_since = datetime.now() - timedelta(days=CANCELLATION_BLOCK_DAYS)
    return select(InspectionOrder.id_uc).where(
        InspectionOrder.status == InspectionStatus.CANCELADA.value,
        InspectionOrder.motivo_cancelamento.in_([reason.value for reason in BLOCKING_CANCELLATION_REASONS]),
        InspectionOrder.atualizado_em >= blocked_since,
    )


def _field_history_query(cutoff: date, history_until: date | None, *, irregular: bool) -> Select:
    """UCs inspecionadas em campo desde `cutoff` e, se informado, antes de `history_until` (exclusivo)."""
    # Um único id_uc NULL faria o NOT IN avaliar UNKNOWN para todas as UCs e esvaziar a fila.
    until_condition = [fato_inspecoes_perdas.c.data_inspecao < history_until.isoformat()] if history_until else []
    return select(fato_inspecoes_perdas.c.id_uc).where(
        fato_inspecoes_perdas.c.id_uc.is_not(None),
        fato_inspecoes_perdas.c.data_inspecao >= cutoff.isoformat(),
        _irregularity_condition(fato_inspecoes_perdas.c.irregularidade_constatada, irregular=irregular),
        *until_condition,
    )


def _irregular_inspections_query(
    since: date, *, include_field_history: bool, history_until: date | None
) -> Select | CompoundSelect:
    """UCs com irregularidade constatada desde `since`, por ordem concluída no sistema ou pelo histórico de campo."""
    system_orders = _system_orders_query(since, irregular=True)
    if not include_field_history:
        return system_orders
    return union(system_orders, _field_history_query(since, history_until, irregular=True))


def _reincidence_condition(
    consumo: Subquery, windows: ConsumptionWindows, *, include_field_history: bool, history_until: date | None
) -> ColumnElement[bool]:
    """Prazo de reincidência: irregularidade constatada mantém a UC fora da fila por 12 meses.

    A UC volta antes do prazo só com uma nova queda súbita, e só se a janela recente inteira for posterior à
    inspeção; uma queda que começou antes da inspeção pode ser a mesma que motivou a visita.
    """
    uc = dim_unidade_consumidora
    within_term = _irregular_inspections_query(
        reincidence_cutoff_date(windows), include_field_history=include_field_history, history_until=history_until
    )
    inspected_in_recent_window = _irregular_inspections_query(
        competencia_first_day(windows.inicio_recente),
        include_field_history=include_field_history,
        history_until=history_until,
    )
    has_new_sudden_drop = consumo.c.consumo_recente_kwh <= consumo.c.consumo_base_kwh * (1 - LIMIAR_QUEDA_SUBITA)
    returns_early = and_(uc.c.id_uc.not_in(inspected_in_recent_window), has_new_sudden_drop)
    return or_(uc.c.id_uc.not_in(within_term), returns_early)


def excluded_units_query(
    windows: ConsumptionWindows, *, include_field_history: bool = True, history_until: date | None = None
) -> Select | CompoundSelect:
    """Lista as UCs que não podem entrar na fila.

    Saem da fila: UCs inspecionadas dentro da janela de análise, seja por ordem concluída no
    sistema, seja pelo histórico de campo. Também saem as UCs com ordem cancelada por cliente regularizado ou
    endereço não localizado nos últimos `CANCELLATION_BLOCK_DAYS` dias. Ordens ativas não excluem.

    Args:
        windows: Janelas de análise da fila.
        include_field_history: False ignora `fato_inspecoes_perdas` (tabela ainda não exportada pela Fatia 02).
        history_until: Data (exclusiva) a partir da qual as inspeções do histórico de campo não contam, para ver
            a fila como ela estava numa competência passada; None considera todo o histórico.

    Returns:
        `id_uc` excluídos; UNION com o histórico de campo quando ele é aplicado.
    """
    cutoff = inspection_cutoff_date(windows)
    system_exclusions = [_system_orders_query(cutoff, irregular=False), _blocking_cancellations_query()]
    if not include_field_history:
        return union(*system_exclusions)
    return union(*system_exclusions, _field_history_query(cutoff, history_until, irregular=False))


def _candidate_select(consumo: Subquery) -> Select:
    """SELECT do cadastro e do consumo agregado, unindo a subquery `consumo` à dimensão de UC."""
    uc = dim_unidade_consumidora
    return select(
        uc.c.id_uc, uc.c.municipio, uc.c.bairro, uc.c.classe_consumo,
        consumo.c.consumo_base_kwh, consumo.c.consumo_recente_kwh, consumo.c.meses_zerados, consumo.c.meses_base,
    ).join_from(consumo, uc, uc.c.id_uc == consumo.c.id_uc)


def _candidate_conditions(
    consumo: Subquery,
    filters: SuspicionFilters,
    excluded_units: Select | CompoundSelect,
    reincidence: ColumnElement[bool],
) -> list[ColumnElement[bool]]:
    """Condições para uma UC virar candidata: sem GD, sem inspeção recente, com queda acima do piso ou zerada."""
    uc = dim_unidade_consumidora
    remaining_share = 1 - filters.limiar_queda
    drop_ceiling_kwh = consumo.c.consumo_base_kwh * remaining_share
    has_sudden_drop = consumo.c.consumo_recente_kwh <= drop_ceiling_kwh
    has_zero_reading = consumo.c.meses_zerados > 0
    return [
        uc.c.possui_gd.is_not(true()),
        consumo.c.consumo_base_kwh > 0,
        consumo.c.consumo_recente_kwh.is_not(None),
        has_sudden_drop | has_zero_reading,
        uc.c.id_uc.not_in(excluded_units),
        reincidence,
        *_optional_filters(filters),
    ]


def suspicious_profiles_query(
    windows: ConsumptionWindows,
    filters: SuspicionFilters,
    *,
    include_field_history: bool = True,
    history_until: date | None = None,
) -> Select:
    """Monta a consulta dos perfis de consumo candidatos à fila de suspeitas.

    Candidata é a UC sem GD, sem inspeção recente, com queda acima do limiar ou leitura zerada.
    Ter ordem ativa não a tira da fila.

    Args:
        windows: Janelas base e recente.
        filters: Limiar de queda e filtros opcionais de município, bairro e classe.
        include_field_history: False monta a fila sem excluir as UCs do histórico de campo.
        history_until: Data (exclusiva) em que o histórico de campo deixa de valer; None usa todo o histórico.

    Returns:
        SELECT com cadastro e consumo agregado das UCs candidatas.
    """
    consumo = consumption_subquery(windows)
    excluded_units = excluded_units_query(
        windows, include_field_history=include_field_history, history_until=history_until
    )
    reincidence = _reincidence_condition(
        consumo, windows, include_field_history=include_field_history, history_until=history_until
    )
    return _candidate_select(consumo).where(*_candidate_conditions(consumo, filters, excluded_units, reincidence))
