"""Regras puras de detecção e priorização de UCs suspeitas de perda não técnica."""

from dataclasses import dataclass

from app.features.loss_management.schemas import SuspicionReason, SuspiciousUnitDTO

LIMIAR_QUEDA_SUBITA = 0.5
JANELA_RECUPERACAO_MESES = 3
TARIFA_MEDIA_RS_KWH = 0.85
PESO_QUEDA_CONSUMO = 80.0
BONUS_LEITURA_ZERADA = 20.0
SCORE_MAXIMO = 100.0


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
        Motivos detectados (queda súbita e/ou leitura zerada); vazio se a UC não é suspeita.
    """
    has_sudden_drop = consumption_drop_ratio(profile) >= LIMIAR_QUEDA_SUBITA
    has_zero_reading = profile.meses_zerados > 0
    reason_checks = (
        (has_sudden_drop, SuspicionReason.QUEDA_SUBITA),
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


def estimated_recoverable_kwh(profile: ConsumptionProfile) -> float:
    """Estima a energia não faturada na janela de recuperação.

    Args:
        profile: Consumo médio da UC nas janelas base e recente.

    Returns:
        Déficit mensal (base - recente, mínimo 0) multiplicado pelos meses de recuperação.
    """
    consumption_gap_kwh = profile.consumo_base_kwh - profile.consumo_recente_kwh
    monthly_deficit_kwh = max(0.0, consumption_gap_kwh)
    recoverable_kwh = monthly_deficit_kwh * JANELA_RECUPERACAO_MESES
    return round(recoverable_kwh, 1)


def build_suspicious_unit(profile: ConsumptionProfile) -> SuspiciousUnitDTO | None:
    """Converte um perfil de consumo em item da fila de suspeitas.

    Args:
        profile: Consumo médio da UC nas janelas base e recente.

    Returns:
        O item da fila com motivos, score e energia a recuperar, ou None se não há suspeita.
    """
    reasons = detect_reasons(profile)
    if not reasons:
        return None
    recoverable_kwh = estimated_recoverable_kwh(profile)
    recoverable_value_rs = recoverable_kwh * TARIFA_MEDIA_RS_KWH
    return SuspiciousUnitDTO(
        id_uc=profile.id_uc,
        municipio=profile.municipio,
        bairro=profile.bairro,
        classe_consumo=profile.classe_consumo,
        motivos=reasons,
        score_risco=risk_score(profile),
        consumo_base_kwh=round(profile.consumo_base_kwh, 1),
        consumo_recente_kwh=round(profile.consumo_recente_kwh, 1),
        kwh_estimado_recuperar=recoverable_kwh,
        valor_estimado_recuperar_rs=round(recoverable_value_rs, 2),
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
    suspicious_unit = build_suspicious_unit(unit.profile)
    return suspicious_unit.kwh_estimado_recuperar if suspicious_unit else 0.0


def expected_recovery_kwh(unit: SuspiciousUnitDTO) -> float:
    """Calcula o valor esperado de recuperação usado para ordenar a fila.

    Args:
        unit: Item da fila com score de risco e energia estimada.

    Returns:
        Probabilidade relativa (score / 100) multiplicada pelo kWh estimado a recuperar.
    """
    relative_probability = unit.score_risco / SCORE_MAXIMO
    return relative_probability * unit.kwh_estimado_recuperar


def rank_suspicious_units(profiles: list[ConsumptionProfile], limit: int) -> list[SuspiciousUnitDTO]:
    """Monta a fila priorizada pelo valor esperado de recuperação.

    Args:
        profiles: Perfis de consumo candidatos.
        limit: Tamanho máximo da fila.

    Returns:
        Itens suspeitos em ordem decrescente de valor esperado, até `limit` itens.
    """
    candidates = [unit for profile in profiles if (unit := build_suspicious_unit(profile)) is not None]
    ranked = sorted(candidates, key=expected_recovery_kwh, reverse=True)
    return ranked[:limit]
