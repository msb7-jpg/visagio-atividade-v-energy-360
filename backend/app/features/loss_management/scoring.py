"""Regras puras de detecção e priorização de UCs suspeitas de perda não técnica."""

from dataclasses import dataclass, field

from app.features.loss_management.schemas import InspectionStatus, SuspicionReason, SuspiciousUnitDTO

LIMIAR_QUEDA_SUBITA = 0.5
LIMIAR_QUEDA_MODERADA_FORTE = 0.3
LIMIAR_QUEDA_MODERADA = 0.2  # piso da fila classificada: abaixo disso a UC não entra
JANELA_RECUPERACAO_MESES = 3
MESES_POR_ANO = 12
PESO_QUEDA_CONSUMO = 80.0
BONUS_LEITURA_ZERADA = 20.0
SCORE_MAXIMO = 100.0

# Taxas de acerto medidas em fato_inspecoes_perdas (1.389 inspeções; ver changelog de 2026-10-20 e 2026-10-21).
# Só a queda súbita tem taxa própria; a leitura zerada isolada ainda não foi medida e usa a taxa geral.
TAXA_ACERTO_GERAL = 0.627
# Queda moderada: taxa por faixa, medida no v_energy.db real (changelog de 2026-10-27): queda de 30% a 50% = 42%
# (132 de 314 inspeções); de 15% a 30% = 7% (13 de 176). A faixa de 20% a 30% usa a segunda.
TAXA_ACERTO_QUEDA_MODERADA_FORTE = 0.42
TAXA_ACERTO_QUEDA_MODERADA_FRACA = 0.07
TAXA_ACERTO_POR_MOTIVO = {
    SuspicionReason.QUEDA_SUBITA: 0.93,
    SuspicionReason.LEITURA_ZERADA: TAXA_ACERTO_GERAL,
}


@dataclass(frozen=True, slots=True)
class ConsumptionProfile:
    """Consumo médio de uma UC na janela de referência versus a janela recente."""

    id_uc: str
    municipio: str | None
    bairro: str | None
    classe_consumo: str | None
    consumo_base_kwh: float
    consumo_recente_kwh: float
    meses_zerados: int


@dataclass(frozen=True, slots=True)
class QueueCandidates:
    """Perfis candidatos à fila, se o histórico de campo (Fatia 02) foi usado e a competência fixada, se houver."""

    profiles: list[ConsumptionProfile]
    field_history_applied: bool
    reference_competencia: str | None = None  # só preenchida quando a fila não usa a competência mais recente
    active_orders: dict[str, InspectionStatus] = field(default_factory=dict)  # status da ordem ativa por id_uc


@dataclass(frozen=True, slots=True)
class RegisteredUnit:
    """UC encontrada no cadastro, com seu perfil de consumo e a indicação de geração distribuída."""

    profile: ConsumptionProfile
    possui_gd: bool
    has_recent_reading: bool


def consumption_drop_ratio(profile: ConsumptionProfile) -> float:
    """Calcula a fração de queda do consumo recente em relação à base.

    Args:
        profile: Consumo médio da UC nas janelas base e recente.

    Returns:
        Queda entre 0 e 1 (0 quando não houve queda ou a base é nula).
    """
    if profile.consumo_base_kwh <= 0:
        return 0.0
    recent_share = profile.consumo_recente_kwh / profile.consumo_base_kwh
    drop_ratio = 1.0 - recent_share
    return max(0.0, drop_ratio)


def detect_reasons(profile: ConsumptionProfile) -> list[SuspicionReason]:
    """Lista os motivos de suspeita aplicáveis ao perfil de consumo.

    Args:
        profile: Consumo médio da UC nas janelas base e recente.

    Returns:
        Motivos detectados (queda súbita, queda moderada e/ou leitura zerada); vazio se a UC não é suspeita.
        Queda súbita e queda moderada são excludentes: a moderada vai do piso até o limiar da súbita.
    """
    drop_ratio = consumption_drop_ratio(profile)
    has_sudden_drop = drop_ratio >= LIMIAR_QUEDA_SUBITA
    has_moderate_drop = LIMIAR_QUEDA_MODERADA <= drop_ratio < LIMIAR_QUEDA_SUBITA
    has_zero_reading = profile.meses_zerados > 0
    reason_checks = (
        (has_sudden_drop, SuspicionReason.QUEDA_SUBITA),
        (has_moderate_drop, SuspicionReason.QUEDA_MODERADA),
        (has_zero_reading, SuspicionReason.LEITURA_ZERADA),
    )
    return [reason for is_detected, reason in reason_checks if is_detected]


def risk_score(profile: ConsumptionProfile) -> float:
    """Calcula o score de risco combinando intensidade da queda e leituras zeradas.

    Args:
        profile: Consumo médio da UC nas janelas base e recente.

    Returns:
        Score de 0 a 100, com uma casa decimal.
    """
    drop_points = consumption_drop_ratio(profile) * PESO_QUEDA_CONSUMO
    zero_points = BONUS_LEITURA_ZERADA if profile.meses_zerados > 0 else 0.0
    raw_score = drop_points + zero_points
    capped_score = min(SCORE_MAXIMO, raw_score)
    return round(capped_score, 1)


def reason_hit_rate(reason: SuspicionReason, drop_ratio: float) -> float:
    """Taxa histórica de acerto de um sinal; a queda moderada varia com a faixa de queda da UC.

    Args:
        reason: Motivo de suspeita.
        drop_ratio: Fração de queda do consumo da UC (0 a 1), usada só pela queda moderada.

    Returns:
        A taxa de acerto do sinal (0 a 1).
    """
    if reason == SuspicionReason.QUEDA_MODERADA:
        is_strong_band = drop_ratio >= LIMIAR_QUEDA_MODERADA_FORTE
        return TAXA_ACERTO_QUEDA_MODERADA_FORTE if is_strong_band else TAXA_ACERTO_QUEDA_MODERADA_FRACA
    return TAXA_ACERTO_POR_MOTIVO[reason]


def hit_probability(reasons: list[SuspicionReason], drop_ratio: float = 0.0) -> float:
    """Estima a chance de uma inspeção achar irregularidade a partir dos sinais da UC.

    Args:
        reasons: Motivos de suspeita detectados na UC.
        drop_ratio: Fração de queda do consumo da UC, para calibrar a taxa da queda moderada por faixa.

    Returns:
        A maior taxa histórica de acerto entre os sinais presentes (0 a 1); 0 sem sinais.
    """
    rates = [reason_hit_rate(reason, drop_ratio) for reason in reasons]
    return max(rates, default=0.0)


def monthly_deficit_kwh(profile: ConsumptionProfile) -> float:
    """Calcula o déficit mensal de consumo da UC.

    Args:
        profile: Consumo médio da UC nas janelas base e recente.

    Returns:
        Consumo base menos consumo recente, em kWh/mês (mínimo 0).
    """
    consumption_gap_kwh = profile.consumo_base_kwh - profile.consumo_recente_kwh
    return max(0.0, consumption_gap_kwh)


def estimated_recoverable_kwh(profile: ConsumptionProfile) -> float:
    """Estima a energia não faturada na janela de recuperação.

    Args:
        profile: Consumo médio da UC nas janelas base e recente.

    Returns:
        Déficit mensal (base - recente, mínimo 0) multiplicado pelos meses de recuperação.
    """
    recoverable_kwh = monthly_deficit_kwh(profile) * JANELA_RECUPERACAO_MESES
    return round(recoverable_kwh, 1)


def build_suspicious_unit(profile: ConsumptionProfile, tariff_rs_kwh: float) -> SuspiciousUnitDTO | None:
    """Converte um perfil de consumo em item da fila de suspeitas.

    Args:
        profile: Consumo médio da UC nas janelas base e recente.
        tariff_rs_kwh: Tarifa média da base (R$/kWh) que converte kWh em R$.

    Returns:
        O item da fila com motivos, score e energia a recuperar, ou None se não há suspeita.
    """
    reasons = detect_reasons(profile)
    if not reasons:
        return None
    recoverable_kwh = estimated_recoverable_kwh(profile)
    recoverable_value_rs = recoverable_kwh * tariff_rs_kwh
    monthly_kwh = monthly_deficit_kwh(profile)
    annual_value_rs = monthly_kwh * MESES_POR_ANO * tariff_rs_kwh
    return SuspiciousUnitDTO(
        id_uc=profile.id_uc,
        municipio=profile.municipio,
        bairro=profile.bairro,
        classe_consumo=profile.classe_consumo,
        motivos=reasons,
        score_risco=risk_score(profile),
        probabilidade_acerto=hit_probability(reasons, consumption_drop_ratio(profile)),
        consumo_base_kwh=round(profile.consumo_base_kwh, 1),
        consumo_recente_kwh=round(profile.consumo_recente_kwh, 1),
        kwh_estimado_recuperar=recoverable_kwh,
        valor_estimado_recuperar_rs=round(recoverable_value_rs, 2),
        kwh_mes_recuperavel=round(monthly_kwh, 1),
        valor_ano_rs=round(annual_value_rs, 2),
    )


def order_estimated_kwh(unit: RegisteredUnit) -> float:
    """Calcula o kWh estimado de uma nova ordem com a mesma regra da fila.

    Args:
        unit: UC do cadastro com seu perfil de consumo.

    Returns:
        O kWh a recuperar que a fila mostraria; 0 para ordem manual (UC com GD, sem leitura recente
        ou sem suspeita), pois a fila não lista essas UCs.
    """
    if unit.possui_gd or not unit.has_recent_reading:
        return 0.0
    suspicious_unit = build_suspicious_unit(unit.profile, tariff_rs_kwh=0.0)  # só o kWh interessa aqui
    return suspicious_unit.kwh_estimado_recuperar if suspicious_unit else 0.0


def priority_key(unit: SuspiciousUnitDTO) -> tuple[float, float]:
    """Define a chave de prioridade da fila.

    Uma inspeção que não acha nada é um dia de equipe perdido, então "mais promissora" é o kWh
    esperado: energia a recuperar vezes a chance de a inspeção achar irregularidade. A chance vem
    da taxa histórica de acerto do sinal, que não cresce com a queda como o score; assim a queda
    não é contada duas vezes (déficit = base * queda já está no kWh). O score só desempata.

    Args:
        unit: Item da fila com energia estimada, taxa de acerto e score de risco.

    Returns:
        Par (kWh esperado, score de risco) para ordenação decrescente.
    """
    expected_kwh = unit.kwh_estimado_recuperar * unit.probabilidade_acerto
    return expected_kwh, unit.score_risco


def priority_score(unit: SuspiciousUnitDTO, top_expected_kwh: float) -> int:
    """Normaliza o kWh esperado da UC pelo topo da fila para a escala de 0 a 100 exibida na tela.

    Args:
        unit: Item da fila.
        top_expected_kwh: Maior kWh esperado entre todas as UCs candidatas (não só as visíveis).

    Returns:
        Score inteiro de 0 a 100; 0 quando a fila não tem energia esperada.
    """
    if top_expected_kwh <= 0:
        return 0
    expected_kwh, _ = priority_key(unit)
    return round(expected_kwh / top_expected_kwh * SCORE_MAXIMO)


def rank_suspicious_units(
    profiles: list[ConsumptionProfile],
    limit: int | None,
    *,
    tariff_rs_kwh: float,
    reason: SuspicionReason | None = None,
) -> list[SuspiciousUnitDTO]:
    """Monta a fila priorizada pelo kWh esperado (kWh a recuperar x taxa de acerto do sinal).

    O score de 0 a 100 é calculado sobre todas as candidatas, antes dos filtros, para não mudar
    quando um filtro esconde a UC do topo. O limite vale depois dos filtros.

    Args:
        profiles: Perfis de consumo candidatos.
        limit: Tamanho máximo da fila; None devolve todas as que passam nos filtros.
        tariff_rs_kwh: Tarifa média da base (R$/kWh) usada nos valores em R$.
        reason: Mantém só as UCs com este motivo; None não filtra.

    Returns:
        Itens suspeitos em ordem decrescente de kWh esperado (desempate por score de risco), até `limit` itens.
    """
    candidates = [unit for profile in profiles if (unit := build_suspicious_unit(profile, tariff_rs_kwh)) is not None]
    candidates_by_id = sorted(candidates, key=lambda unit: unit.id_uc)
    ranked = sorted(candidates_by_id, key=priority_key, reverse=True)
    top_expected_kwh = priority_key(ranked[0])[0] if ranked else 0.0
    scored = [unit.model_copy(update={"score": priority_score(unit, top_expected_kwh)}) for unit in ranked]
    visible = [unit for unit in scored if reason is None or reason in unit.motivos]
    return visible if limit is None else visible[:limit]
