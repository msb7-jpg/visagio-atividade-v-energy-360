"""Taxas históricas de acerto das inspeções por sinal, medidas em `fato_inspecoes_perdas`."""

from app.features.loss_management.schemas import SuspicionReason

LIMIAR_QUEDA_NORMALIZADA = 0.2  # queda além da da carteira a partir da qual a queda moderada tem chance alta
MESES_BASE_COMPLETO = 12  # meses da janela de base de uma UC com histórico completo
# Histórico mínimo: 38.628 UCs têm 12 meses de base, 6.304 têm 11 (um mês faltando na limpeza) e só cerca de 90 têm
# menos. Das 1.358 UCs sem GD que o campo inspecionou, só 7 tinham menos de 11 meses: as taxas abaixo foram medidas
# em UCs com histórico completo e não valem para ligações recentes (docs/DECISOES_PERDAS.md D14).
MESES_BASE_MINIMO = 11

# Taxas de acerto medidas em fato_inspecoes_perdas (1.389 inspeções; ver changelog de 2026-10-20 e 2026-10-21).
# Só a queda súbita tem taxa própria; a leitura zerada isolada ainda não foi medida e usa a taxa geral.
TAXA_ACERTO_GERAL = 0.627
# Queda moderada: a taxa depende da queda da UC descontada a queda geral da carteira (mediana de recente/base de todas
# as UCs). Medido no v_energy.db real (docs/DECISOES_PERDAS.md D12), UCs sem GD com queda bruta de 20% a 50%:
# queda normalizada de 20% ou mais = 91,5% (118 de 129 inspeções); abaixo disso = 7,6% (25 de 330).
TAXA_ACERTO_QUEDA_ACIMA_DA_CARTEIRA = 0.915
TAXA_ACERTO_QUEDA_NA_CARTEIRA = 0.076
TAXA_ACERTO_HISTORICO_CURTO = TAXA_ACERTO_QUEDA_NA_CARTEIRA  # sem medição para ligação recente: nunca acima da fraca
TAXA_ACERTO_POR_MOTIVO = {
    SuspicionReason.QUEDA_SUBITA: 0.93,
    SuspicionReason.LEITURA_ZERADA: TAXA_ACERTO_GERAL,
}


def reason_hit_rate(reason: SuspicionReason, normalized_drop: float, base_months: int = MESES_BASE_COMPLETO) -> float:
    """Taxa histórica de acerto de um sinal; a queda moderada varia com a queda além da carteira.

    Args:
        reason: Motivo de suspeita.
        normalized_drop: Queda da UC além da queda geral da carteira (0 a 1), usada só pela queda moderada.
        base_months: Meses com leitura na janela de base da UC; com menos de `MESES_BASE_MINIMO` a taxa medida em
            UCs com histórico completo não vale e a chance não passa da taxa fraca.

    Returns:
        A taxa de acerto do sinal (0 a 1).
    """
    if reason == SuspicionReason.QUEDA_MODERADA:
        is_above_portfolio = normalized_drop >= LIMIAR_QUEDA_NORMALIZADA
        rate = TAXA_ACERTO_QUEDA_ACIMA_DA_CARTEIRA if is_above_portfolio else TAXA_ACERTO_QUEDA_NA_CARTEIRA
    else:
        rate = TAXA_ACERTO_POR_MOTIVO[reason]
    return min(rate, TAXA_ACERTO_HISTORICO_CURTO) if base_months < MESES_BASE_MINIMO else rate


def hit_probability(
    reasons: list[SuspicionReason], normalized_drop: float = 0.0, base_months: int = MESES_BASE_COMPLETO
) -> float:
    """Estima a chance de uma inspeção achar irregularidade a partir dos sinais da UC.

    Args:
        reasons: Motivos de suspeita detectados na UC.
        normalized_drop: Queda da UC além da queda geral da carteira, para calibrar a taxa da queda moderada.
        base_months: Meses com leitura na janela de base da UC (histórico curto limita a chance).

    Returns:
        A maior taxa histórica de acerto entre os sinais presentes (0 a 1); 0 sem sinais.
    """
    rates = [reason_hit_rate(reason, normalized_drop, base_months) for reason in reasons]
    return max(rates, default=0.0)
