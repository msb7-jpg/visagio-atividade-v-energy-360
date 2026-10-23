from collections.abc import Sequence
from itertools import groupby

from app.features.revenue.decomposition import CASAS_DECIMAIS, SegmentTotals, segment_effects, sum_effects
from app.features.revenue.kpis import safe_ratio
from app.features.revenue.schemas import BreakdownLevel, BreakdownRowDTO, BreakdownSortField, SortOrder

type GroupKey = tuple[str | None, str | None, str | None]


def group_key(segment: SegmentTotals, level: BreakdownLevel) -> GroupKey:
    """Chave (município, bairro, classe) que identifica a linha do ranking a que o segmento pertence."""
    match level:
        case BreakdownLevel.CLASSE_CONSUMO:
            return (None, None, segment.classe_consumo)
        case BreakdownLevel.MUNICIPIO:
            return (segment.municipio, None, None)
        case _:
            return (segment.municipio, segment.bairro, None)


def sortable(key: GroupKey) -> tuple[str, str, str]:
    """Chave de ordenação que aceita partes ausentes (None vira texto vazio)."""
    municipio, bairro, classe = key
    return (municipio or "", bairro or "", classe or "")


def build_row(key: GroupKey, members: Sequence[SegmentTotals]) -> BreakdownRowDTO:
    """Soma os segmentos de um grupo e seus efeitos de preço, volume e cruzado."""
    municipio, bairro, classe = key
    effects = sum_effects([segment_effects(member) for member in members])
    base_volume = sum(member.volume_base_kwh for member in members)
    current_volume = sum(member.volume_atual_kwh for member in members)
    base_revenue = sum(member.receita_base_rs for member in members)
    current_revenue = sum(member.receita_atual_rs for member in members)
    volume_change = safe_ratio(current_volume - base_volume, base_volume)
    return BreakdownRowDTO(
        municipio=municipio,
        bairro=bairro,
        classe_consumo=classe,
        volume_base_kwh=round(base_volume, CASAS_DECIMAIS),
        volume_atual_kwh=round(current_volume, CASAS_DECIMAIS),
        variacao_volume_pct=None if volume_change is None else round(volume_change * 100, 1),
        receita_base_rs=round(base_revenue, CASAS_DECIMAIS),
        receita_atual_rs=round(current_revenue, CASAS_DECIMAIS),
        variacao_rs=round(current_revenue - base_revenue, CASAS_DECIMAIS),
        efeito_preco_rs=round(effects.preco_rs, CASAS_DECIMAIS),
        efeito_volume_rs=round(effects.volume_rs, CASAS_DECIMAIS),
        efeito_cruzado_rs=round(effects.cruzado_rs, CASAS_DECIMAIS),
    )


def build_breakdown(segments: Sequence[SegmentTotals], level: BreakdownLevel) -> list[BreakdownRowDTO]:
    """Agrupa os segmentos no nível pedido e calcula a variação de receita de cada grupo.

    O efeito de cada linha é a soma dos efeitos dos seus segmentos, então a soma de todas as linhas é a variação
    total de receita.

    Args:
        segments: Totais por segmento (classe x município x bairro) nas duas janelas.
        level: Nível em que as linhas são agrupadas.

    Returns:
        Uma linha por município, bairro ou classe.
    """
    ordered = sorted(segments, key=lambda segment: sortable(group_key(segment, level)))
    grouped = groupby(ordered, key=lambda segment: group_key(segment, level))
    return [build_row(key, list(members)) for key, members in grouped]


def sort_rows(rows: Sequence[BreakdownRowDTO], field: BreakdownSortField, order: SortOrder) -> list[BreakdownRowDTO]:
    """Ordena o ranking pela coluna escolhida; empates seguem a ordem alfabética de município e bairro."""
    return sorted(
        rows,
        key=lambda row: (getattr(row, field.value), row.municipio or "", row.bairro or "", row.classe_consumo or ""),
        reverse=order is SortOrder.DESC,
    )