"""Razão de referência de uma UC: a dos pares da classe, ou a que o chamador usa quando o perfil não tem pares."""


def pairs_ratio(peer_ratio: float | None, default_ratio: float) -> float:
    """Escolhe a razão recente/base de referência de uma UC.

    Args:
        peer_ratio: Mediana de recente/base da classe da UC (os pares); None quando o perfil não tem pares.
        default_ratio: Razão usada sem pares: 1.0 mede a queda bruta, a da carteira desconta a queda geral.

    Returns:
        A razão dos pares quando existe; senão `default_ratio`.
    """
    return default_ratio if peer_ratio is None else peer_ratio
