"""Taxas históricas de acerto das inspeções por sinal, medidas em `fato_inspecoes_perdas`."""

from app.features.loss_management.schemas import SuspicionReason

LIMIAR_QUEDA_NORMALIZADA = 0.2  # queda além da da carteira a partir da qual a queda moderada tem chance alta

# Taxas de acerto medidas em fato_inspecoes_perdas (1.389 inspeções; ver changelog de 2026-10-20 e 2026-10-21).
# Só a queda súbita tem taxa própria; a leitura zerada isolada ainda não foi medida e usa a taxa geral.
TAXA_ACERTO_GERAL = 0.627
# Queda moderada: a taxa depende da queda da UC descontada a queda geral da carteira (mediana de recente/base de todas
# as UCs). Medido no v_energy.db real (docs/DECISOES_PERDAS.md D12), UCs sem GD com queda bruta de 20% a 50%:
# queda normalizada de 20% ou mais = 91,5% (118 de 129 inspeções); abaixo disso = 7,6% (25 de 330).
TAXA_ACERTO_QUEDA_ACIMA_DA_CARTEIRA = 0.915
TAXA_ACERTO_QUEDA_NA_CARTEIRA = 0.076
TAXA_ACERTO_POR_MOTIVO = {
    SuspicionReason.QUEDA_SUBITA: 0.93,
    SuspicionReason.LEITURA_ZERADA: TAXA_ACERTO_GERAL,
}


def reason_hit_rate(reason: SuspicionReason, normalized_drop: float) -> float:
    """Taxa histórica de acerto de um sinal; a queda moderada varia com a queda além da carteira.

    Args:
        reason: Motivo de suspeita.
        normalized_drop: Queda da UC além da queda geral da carteira (0 a 1), usada só pela queda moderada.

    Returns:
        A taxa de acerto do sinal (0 a 1).
    """
    if reason == SuspicionReason.QUEDA_MODERADA:
        is_above_portfolio = normalized_drop >= LIMIAR_QUEDA_NORMALIZADA
        return TAXA_ACERTO_QUEDA_ACIMA_DA_CARTEIRA if is_above_portfolio else TAXA_ACERTO_QUEDA_NA_CARTEIRA
    return TAXA_ACERTO_POR_MOTIVO[reason]


def hit_probability(reasons: list[SuspicionReason], normalized_drop: float = 0.0) -> float:
    """Estima a chance de uma inspeção achar irregularidade a partir dos sinais da UC.

    Args:
        reasons: Motivos de suspeita detectados na UC.
        normalized_drop: Queda da UC além da queda geral da carteira, para calibrar a taxa da queda moderada.

    Returns:
        A maior taxa histórica de acerto entre os sinais presentes (0 a 1); 0 sem sinais.
    """
    rates = [reason_hit_rate(reason, normalized_drop) for reason in reasons]
    return max(rates, default=0.0)
