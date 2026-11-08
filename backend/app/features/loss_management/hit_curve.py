"""Chance de acerto pela queda relativa aos pares: dois patamares medidos e uma rampa onde não há medição (D16)."""

# Medido em fato_inspecoes_perdas (1.354 inspeções sem GD, ago-dez/2025), com a queda de cada UC relativa à mediana da
# sua classe no mês anterior à inspeção: acima de 30% o acerto é de 92,5% (897 inspeções) e fica plano até 70%;
# abaixo de 20% é de 7,9% (455 inspeções). Entre 20% e 30% há 2 inspeções: a taxa ali não é conhecida.
TAXA_ACERTO_ALTA = 0.925
TAXA_ACERTO_BAIXA = 0.079
LIMIAR_QUEDA_BAIXA = 0.2
LIMIAR_QUEDA_ALTA = 0.3


def curve_hit_rate(relative_drop: float) -> float:
    """Chance de uma inspeção achar irregularidade, dada a queda da UC além dos pares da sua classe.

    A faixa de `LIMIAR_QUEDA_BAIXA` a `LIMIAR_QUEDA_ALTA` não tem inspeções medidas. A rampa linear entre os dois
    patamares é a interpolação que menos afirma sobre ela: é suposição, e só o piloto fora da fila (D13) a mede.

    Args:
        relative_drop: Queda relativa aos pares, de 0 a 1.

    Returns:
        A taxa do patamar baixo até o limiar baixo, a do patamar alto a partir do limiar alto e, entre os dois, o
        valor da reta que liga os patamares.
    """
    if relative_drop <= LIMIAR_QUEDA_BAIXA:
        return TAXA_ACERTO_BAIXA
    if relative_drop >= LIMIAR_QUEDA_ALTA:
        return TAXA_ACERTO_ALTA
    position = (relative_drop - LIMIAR_QUEDA_BAIXA) / (LIMIAR_QUEDA_ALTA - LIMIAR_QUEDA_BAIXA)
    return TAXA_ACERTO_BAIXA + position * (TAXA_ACERTO_ALTA - TAXA_ACERTO_BAIXA)
