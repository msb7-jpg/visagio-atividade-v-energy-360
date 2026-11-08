"""Consulta da fila de suspeitas: UCs candidatas por queda de consumo, descontadas as já inspecionadas."""

from collections.abc import Mapping
from datetime import date, datetime, timedelta

from sqlalchemy import CompoundSelect, Select, Subquery, and_, case, or_, select, true, union
from sqlalchemy.sql.elements import ColumnElement

from app.features.loss_management.models import InspectionOrder
from app.features.loss_management.portfolio_repository import NEUTRAL_PORTFOLIO_RATIO
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


def orders_until_condition(until: date | None) -> list[ColumnElement[bool]]:
    """Limita as ordens do portal às feitas antes de `until` (exclusivo), para ver a fila como estava no passado.

    Sem `until` (tempo real), toda ordem registrada vale.
    """
    if until is None:
        return []
    return [InspectionOrder.atualizado_em < datetime.combine(until, datetime.min.time())]


def cancellation_block_start(until: date | None) -> datetime:
    """Início dos `CANCELLATION_BLOCK_DAYS` em que um cancelamento bloqueante ainda mantém a UC fora da fila.

    Conta a partir de `until` quando a fila é vista no passado, e a partir de agora no tempo real.
    """
    reference_moment = datetime.combine(until, datetime.min.time()) if until else datetime.now()
    return reference_moment - timedelta(days=CANCELLATION_BLOCK_DAYS)


def _system_orders_query(cutoff: date, *, irregular: bool, until: date | None = None) -> Select:
    """UCs com ordem concluída desde `cutoff` (e antes de `until`, se informado) no sistema, com ou sem irregularidade.

    Ordens ativas não excluem: a UC segue na fila, marcada com a situação da ordem.
    """
    cutoff_datetime = datetime.combine(cutoff, datetime.min.time())
    return select(InspectionOrder.id_uc).where(
        InspectionOrder.status == COMPLETED_STATUS,
        InspectionOrder.atualizado_em >= cutoff_datetime,
        *orders_until_condition(until),
        _irregularity_condition(InspectionOrder.irregularidade_constatada, irregular=irregular),
    )


def _irregularity_condition(column: ColumnElement[bool], *, irregular: bool) -> ColumnElement[bool]:
    """Inspeção com irregularidade constatada, ou sem ela (inclui o resultado ainda não informado)."""
    return column.is_(true()) if irregular else column.is_not(true())


def _blocking_cancellations_query(until: date | None = None) -> Select:
    """UCs cuja ordem foi cancelada por um motivo que torna inútil uma nova visita agora.

    O cliente já regularizou, ou o endereço não foi localizado e outra ordem falharia do mesmo jeito. A UC fica
    fora da fila por `CANCELLATION_BLOCK_DAYS`; os demais motivos devolvem a UC à fila na hora. Com `until`, só
    valem os cancelamentos feitos antes dele e os 90 dias contam a partir dele.
    """
    return select(InspectionOrder.id_uc).where(
        InspectionOrder.status == InspectionStatus.CANCELADA.value,
        InspectionOrder.motivo_cancelamento.in_([reason.value for reason in BLOCKING_CANCELLATION_REASONS]),
        InspectionOrder.atualizado_em >= cancellation_block_start(until),
        *orders_until_condition(until),
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
    system_orders = _system_orders_query(since, irregular=True, until=history_until)
    if not include_field_history:
        return system_orders
    return union(system_orders, _field_history_query(since, history_until, irregular=True))


def _reincidence_condition(
    consumo: Subquery,
    windows: ConsumptionWindows,
    *,
    include_field_history: bool,
    history_until: date | None,
    portfolio_ratio: float,
) -> ColumnElement[bool]:
    """Prazo de reincidência: irregularidade constatada mantém a UC fora da fila por 12 meses.

    A UC volta antes do prazo só com uma nova queda súbita, e só se a janela recente inteira for posterior à
    inspeção; uma queda que começou antes da inspeção pode ser a mesma que motivou a visita.

    A queda súbita é medida além da queda geral da carteira: com a mediana em 60% do consumo base, a UC só volta
    se o consumo recente for 50% ou menos desses 60%. Carteira que cresceu não afrouxa a regra (teto de 1,0).
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
    expected_recent_kwh = consumo.c.consumo_base_kwh * min(portfolio_ratio, NEUTRAL_PORTFOLIO_RATIO)
    has_new_sudden_drop = consumo.c.consumo_recente_kwh <= expected_recent_kwh * (1 - LIMIAR_QUEDA_SUBITA)
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
    system_exclusions = [
        _system_orders_query(cutoff, irregular=False, until=history_until),
        _blocking_cancellations_query(history_until),
    ]
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


def _expected_share(
    peer_ratios: Mapping[str | None, float] | None, portfolio_ratio: float
) -> ColumnElement[float] | float:
    """Fração do consumo base que a UC deveria manter: a mediana da classe (pares), ou 1.0 sem pares."""
    if peer_ratios is None:
        return 1.0
    if not peer_ratios:
        return portfolio_ratio  # modelo com pares, mas nenhuma classe medida: todas usam a mediana da carteira
    return case(dict(peer_ratios), value=dim_unidade_consumidora.c.classe_consumo, else_=portfolio_ratio)


def _signal_conditions(
    consumo: Subquery, filters: SuspicionFilters, expected_share: ColumnElement[float] | float = 1.0
) -> list[ColumnElement[bool]]:
    """Condições do sinal de suspeita: base com consumo e queda acima do piso (ou leitura zerada).

    A queda é medida além do que os pares da classe caíram (`expected_share`); 1.0 mede a queda bruta.
    """
    drop_ceiling_kwh = consumo.c.consumo_base_kwh * expected_share * (1 - filters.limiar_queda)
    has_drop = consumo.c.consumo_recente_kwh <= drop_ceiling_kwh
    has_zero_reading = consumo.c.meses_zerados > 0
    return [consumo.c.consumo_base_kwh > 0, consumo.c.consumo_recente_kwh.is_not(None), has_drop | has_zero_reading]


def evaluated_profiles_query(
    windows: ConsumptionWindows,
    filters: SuspicionFilters,
    *,
    peer_ratios: Mapping[str | None, float] | None = None,
    portfolio_ratio: float = NEUTRAL_PORTFOLIO_RATIO,
) -> Select:
    """UCs com sinal de suspeita (queda ou leitura zerada), com ou sem GD ou inspeção que as tire da fila.

    Args:
        windows: Janelas base e recente.
        filters: Limiar de queda e filtros opcionais.
        peer_ratios: Mediana de recente/base de cada classe; com ela o sinal é a queda além dos pares, como na fila.
        portfolio_ratio: Razão da carteira, usada pela classe que não aparece em `peer_ratios`.

    Returns:
        SELECT dos perfis de consumo mais a coluna `possui_gd`; a aba "Fora da fila" subtrai a fila real dele.
    """
    consumo = consumption_subquery(windows)
    expected_share = _expected_share(peer_ratios, portfolio_ratio)
    return (
        _candidate_select(consumo)
        .add_columns(dim_unidade_consumidora.c.possui_gd)
        .where(*_signal_conditions(consumo, filters, expected_share), *_optional_filters(filters))
    )


def _candidate_conditions(
    consumo: Subquery,
    filters: SuspicionFilters,
    excluded_units: Select | CompoundSelect,
    reincidence: ColumnElement[bool],
    expected_share: ColumnElement[float] | float = 1.0,
) -> list[ColumnElement[bool]]:
    """Condições para uma UC virar candidata: sem GD, sem inspeção recente, com queda acima do piso ou zerada."""
    uc = dim_unidade_consumidora
    return [
        uc.c.possui_gd.is_not(true()),
        *_signal_conditions(consumo, filters, expected_share),
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
    portfolio_ratio: float = NEUTRAL_PORTFOLIO_RATIO,
    peer_ratios: Mapping[str | None, float] | None = None,
) -> Select:
    """Monta a consulta dos perfis de consumo candidatos à fila de suspeitas.

    Candidata é a UC sem GD, sem inspeção recente, com queda acima do limiar ou leitura zerada.
    Ter ordem ativa não a tira da fila.

    Args:
        windows: Janelas base e recente.
        filters: Limiar de queda e filtros opcionais de município, bairro e classe.
        include_field_history: False monta a fila sem excluir as UCs do histórico de campo.
        history_until: Data (exclusiva) em que o histórico de campo deixa de valer; None usa todo o histórico.
        portfolio_ratio: Razão mediana recente/base da carteira, que a regra de retorno antecipado desconta da
            queda da UC; 1.0 (padrão) usa a queda bruta.
        peer_ratios: Mediana de recente/base de cada classe (D16); com ela a queda de entrada é medida além dos
            pares da classe, e a classe fora do mapa usa `portfolio_ratio`. None mede a queda bruta.

    Returns:
        SELECT com cadastro e consumo agregado das UCs candidatas.
    """
    consumo = consumption_subquery(windows)
    excluded_units = excluded_units_query(
        windows, include_field_history=include_field_history, history_until=history_until
    )
    reincidence = _reincidence_condition(
        consumo,
        windows,
        include_field_history=include_field_history,
        history_until=history_until,
        portfolio_ratio=portfolio_ratio,
    )
    expected_share = _expected_share(peer_ratios, portfolio_ratio)
    conditions = _candidate_conditions(consumo, filters, excluded_units, reincidence, expected_share)
    return _candidate_select(consumo).where(*conditions)
