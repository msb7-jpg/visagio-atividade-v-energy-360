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


def consumption_drop_ratio(profile: ConsumptionProfile) -> float:
    """Fração de queda do consumo recente em relação à base (0 quando não houve queda)."""
    if profile.consumo_base_kwh <= 0:
        return 0.0
    recent_share = profile.consumo_recente_kwh / profile.consumo_base_kwh
    return max(0.0, 1.0 - recent_share)


def detect_reasons(profile: ConsumptionProfile) -> list[SuspicionReason]:
    """Lista os motivos de suspeita aplicáveis ao perfil de consumo."""
    reasons: list[SuspicionReason] = []
    if consumption_drop_ratio(profile) >= LIMIAR_QUEDA_SUBITA:
        reasons.append(SuspicionReason.QUEDA_SUBITA)
    if profile.meses_zerados > 0:
        reasons.append(SuspicionReason.LEITURA_ZERADA)
    return reasons


def risk_score(profile: ConsumptionProfile) -> float:
    """Score de risco de 0 a 100 combinando intensidade da queda e leituras zeradas."""
    drop_points = consumption_drop_ratio(profile) * PESO_QUEDA_CONSUMO
    zero_points = BONUS_LEITURA_ZERADA if profile.meses_zerados > 0 else 0.0
    return round(min(SCORE_MAXIMO, drop_points + zero_points), 1)


def estimated_recoverable_kwh(profile: ConsumptionProfile) -> float:
    """Energia não faturada estimada na janela de recuperação."""
    monthly_deficit_kwh = max(0.0, profile.consumo_base_kwh - profile.consumo_recente_kwh)
    return round(monthly_deficit_kwh * JANELA_RECUPERACAO_MESES, 1)


def build_suspicious_unit(profile: ConsumptionProfile) -> SuspiciousUnitDTO | None:
    """Converte um perfil em item da fila, ou None quando não há motivo de suspeita."""
    reasons = detect_reasons(profile)
    if not reasons:
        return None
    recoverable_kwh = estimated_recoverable_kwh(profile)
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
        valor_estimado_recuperar_rs=round(recoverable_kwh * TARIFA_MEDIA_RS_KWH, 2),
    )


def expected_recovery_kwh(unit: SuspiciousUnitDTO) -> float:
    """Valor esperado de recuperação: probabilidade relativa x energia estimada."""
    return unit.score_risco / SCORE_MAXIMO * unit.kwh_estimado_recuperar


def rank_suspicious_units(profiles: list[ConsumptionProfile], limit: int) -> list[SuspiciousUnitDTO]:
    """Monta a fila priorizada pelo valor esperado de recuperação (decrescente)."""
    candidates = [unit for profile in profiles if (unit := build_suspicious_unit(profile)) is not None]
    ranked = sorted(candidates, key=expected_recovery_kwh, reverse=True)
    return ranked[:limit]
