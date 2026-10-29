"""Consulta da fila de suspeitas: UCs candidatas por queda de consumo, descontadas as já inspecionadas."""

from datetime import date, datetime

from sqlalchemy import CompoundSelect, Select, Subquery, select, true
from sqlalchemy.sql.elements import ColumnElement

from app.features.loss_management.models import InspectionOrder
from app.features.loss_management.queries import (
    COMPLETED_STATUS,
    ConsumptionWindows,
    SuspicionFilters,
    consumption_subquery,
    dim_unidade_consumidora,
    fato_inspecoes_perdas,
    inspection_cutoff_date,
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


def _system_orders_query(cutoff: date) -> Select:
    """UCs com ordem concluída desde `cutoff` no sistema.

    Ordens ativas não excluem: a UC segue na fila, marcada com a situação da ordem. Canceladas não excluem.
    """
    cutoff_datetime = datetime.combine(cutoff, datetime.min.time())
    return select(InspectionOrder.id_uc).where(
        InspectionOrder.status == COMPLETED_STATUS,
        InspectionOrder.atualizado_em >= cutoff_datetime,
    )


def _field_history_query(cutoff: date, history_until: date | None) -> Select:
    """UCs inspecionadas em campo desde `cutoff` e, se informado, antes de `history_until` (exclusivo)."""
    # Um único id_uc NULL faria o NOT IN avaliar UNKNOWN para todas as UCs e esvaziar a fila.
    until_condition = [fato_inspecoes_perdas.c.data_inspecao < history_until.isoformat()] if history_until else []
    return select(fato_inspecoes_perdas.c.id_uc).where(
        fato_inspecoes_perdas.c.id_uc.is_not(None),
        fato_inspecoes_perdas.c.data_inspecao >= cutoff.isoformat(),
        *until_condition,
    )


def excluded_units_query(
    windows: ConsumptionWindows, *, include_field_history: bool = True, history_until: date | None = None
) -> Select | CompoundSelect:
    """Lista as UCs que não podem entrar na fila.

    Saem da fila: UCs inspecionadas dentro da janela de análise, seja por ordem concluída no
    sistema, seja pelo histórico de campo. Ordens ativas e canceladas não excluem.

    Args:
        windows: Janelas de análise da fila.
        include_field_history: False ignora `fato_inspecoes_perdas` (tabela ainda não exportada pela Fatia 02).
        history_until: Data (exclusiva) a partir da qual as inspeções do histórico de campo não contam, para ver
            a fila como ela estava numa competência passada; None considera todo o histórico.

    Returns:
        `id_uc` excluídos; UNION com o histórico de campo quando ele é aplicado.
    """
    cutoff = inspection_cutoff_date(windows)
    system_orders = _system_orders_query(cutoff)
    if not include_field_history:
        return system_orders
    return system_orders.union(_field_history_query(cutoff, history_until))


def _candidate_select(consumo: Subquery) -> Select:
    """SELECT do cadastro e do consumo agregado, unindo a subquery `consumo` à dimensão de UC."""
    uc = dim_unidade_consumidora
    return select(
        uc.c.id_uc, uc.c.municipio, uc.c.bairro, uc.c.classe_consumo,
        consumo.c.consumo_base_kwh, consumo.c.consumo_recente_kwh, consumo.c.meses_zerados, consumo.c.meses_base,
    ).join_from(consumo, uc, uc.c.id_uc == consumo.c.id_uc)


def _candidate_conditions(
    consumo: Subquery, filters: SuspicionFilters, excluded_units: Select | CompoundSelect
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
    return _candidate_select(consumo).where(*_candidate_conditions(consumo, filters, excluded_units))
