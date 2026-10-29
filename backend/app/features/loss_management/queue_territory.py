"""Filtros territoriais e de classe da fila, aplicados depois do ranking para o score não depender deles."""

from app.features.loss_management.schemas import SuspiciousUnitDTO, SuspiciousUnitsFilterDTO


def filter_by_territory(
    units: list[SuspiciousUnitDTO], queue_filter: SuspiciousUnitsFilterDTO
) -> list[SuspiciousUnitDTO]:
    """Mantém só as UCs do município, bairro e classe pedidos; critério ausente não filtra.

    O score de cada UC já foi normalizado pelo topo da fila inteira, então a UC mostra o mesmo score
    na lista (com ou sem filtro) e no painel de detalhe.

    Args:
        units: Fila ranqueada e com score, sem filtros territoriais.
        queue_filter: Filtros recebidos pela API.

    Returns:
        As UCs que atendem a todos os critérios informados, na mesma ordem.
    """
    criteria = (
        ("municipio", queue_filter.municipio),
        ("bairro", queue_filter.bairro),
        ("classe_consumo", queue_filter.classe),
    )
    active_criteria = [(field_name, wanted) for field_name, wanted in criteria if wanted is not None]
    return [
        unit for unit in units if all(getattr(unit, field_name) == wanted for field_name, wanted in active_criteria)
    ]
