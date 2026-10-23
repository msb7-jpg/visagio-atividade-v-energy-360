from collections.abc import Sequence
from dataclasses import dataclass
from itertools import starmap
 
from app.features.revenue.schemas import PriceVolumeDecompositionDTO, SegmentDecompositionDTO
 
CASAS_DECIMAIS = 2
 
 
@dataclass(frozen=True, slots=True)
class SegmentTotals:
    """Totais de um segmento (classe x município x bairro) na janela base e na janela atual."""
 
    classe_consumo: str | None
    municipio: str | None
    bairro: str | None
    volume_base_kwh: float
    receita_base_rs: float
    volume_atual_kwh: float
    receita_atual_rs: float
 
 
@dataclass(frozen=True, slots=True)
class PriceVolumeEffects:
    """Efeitos que explicam a variação de receita, em reais."""
 
    preco_rs: float
    volume_rs: float
    cruzado_rs: float
 
 
def segment_effects(totals: SegmentTotals) -> PriceVolumeEffects:
    """Calcula os efeitos preço, volume e cruzado de um segmento.
 
    Segmento novo (sem volume na base) ou perdido (sem volume atual) não tem tarifa comparável, então toda a
    variação de receita é atribuída ao volume.
 
    Args:
        totals: Volumes e receitas do segmento nas duas janelas.
 
    Returns:
        Efeitos cuja soma é a variação de receita do segmento.
    """
    revenue_change = totals.receita_atual_rs - totals.receita_base_rs
    segment_is_new_or_lost = totals.volume_base_kwh <= 0 or totals.volume_atual_kwh <= 0
    if segment_is_new_or_lost:
        return PriceVolumeEffects(preco_rs=0.0, volume_rs=revenue_change, cruzado_rs=0.0)
    base_tariff = totals.receita_base_rs / totals.volume_base_kwh
    current_tariff = totals.receita_atual_rs / totals.volume_atual_kwh
    tariff_change = current_tariff - base_tariff
    volume_change = totals.volume_atual_kwh - totals.volume_base_kwh
    return PriceVolumeEffects(
        preco_rs=tariff_change * totals.volume_base_kwh,
        volume_rs=volume_change * base_tariff,
        cruzado_rs=tariff_change * volume_change,
    )
 
 
def sum_effects(effects: Sequence[PriceVolumeEffects]) -> PriceVolumeEffects:
    """Soma os efeitos de vários segmentos."""
    return PriceVolumeEffects(
        preco_rs=sum(effect.preco_rs for effect in effects),
        volume_rs=sum(effect.volume_rs for effect in effects),
        cruzado_rs=sum(effect.cruzado_rs for effect in effects),
    )
 
 
def pure_volume_effect(segments_volume_effect: float, segments: Sequence[SegmentTotals]) -> float:
    """Efeito da variação do volume total valorada à tarifa média da base (sem troca de composição).
 
    Args:
        segments_volume_effect: Soma dos efeitos de volume dos segmentos.
        segments: Segmentos que compõem o total.
 
    Returns:
        O efeito de volume puro; sem volume na base, devolve o próprio efeito dos segmentos (não há mix).
    """
    base_volume = sum(segment.volume_base_kwh for segment in segments)
    if base_volume <= 0:
        return segments_volume_effect
    base_revenue = sum(segment.receita_base_rs for segment in segments)
    current_volume = sum(segment.volume_atual_kwh for segment in segments)
    base_average_tariff = base_revenue / base_volume
    return (current_volume - base_volume) * base_average_tariff
 
 
def build_segment_dto(totals: SegmentTotals, effects: PriceVolumeEffects) -> SegmentDecompositionDTO:
    """Converte os totais e efeitos de um segmento no DTO da API."""
    return SegmentDecompositionDTO(
        classe_consumo=totals.classe_consumo,
        municipio=totals.municipio,
        bairro=totals.bairro,
        receita_base_rs=round(totals.receita_base_rs, CASAS_DECIMAIS),
        receita_atual_rs=round(totals.receita_atual_rs, CASAS_DECIMAIS),
        variacao_rs=round(totals.receita_atual_rs - totals.receita_base_rs, CASAS_DECIMAIS),
        efeito_preco_rs=round(effects.preco_rs, CASAS_DECIMAIS),
        efeito_volume_rs=round(effects.volume_rs, CASAS_DECIMAIS),
        efeito_cruzado_rs=round(effects.cruzado_rs, CASAS_DECIMAIS),
    )
 
 
def decompose(segments: Sequence[SegmentTotals]) -> PriceVolumeDecompositionDTO:
    """Decompõe a variação de receita total em preço, volume, mix e efeito cruzado.
 
    Args:
        segments: Totais por segmento nas janelas base e atual.
 
    Returns:
        DTO com os efeitos totais (cuja soma é a variação de receita) e o detalhe por segmento.
    """
    effects_by_segment = [segment_effects(segment) for segment in segments]
    total_effects = sum_effects(effects_by_segment)
    volume_effect = pure_volume_effect(total_effects.volume_rs, segments)
    mix_effect = total_effects.volume_rs - volume_effect
    base_revenue = sum(segment.receita_base_rs for segment in segments)
    current_revenue = sum(segment.receita_atual_rs for segment in segments)
    revenue_change = current_revenue - base_revenue
    change_pct = round(revenue_change / base_revenue * 100, 1) if base_revenue > 0 else None
    return PriceVolumeDecompositionDTO(
        receita_base_rs=round(base_revenue, CASAS_DECIMAIS),
        receita_atual_rs=round(current_revenue, CASAS_DECIMAIS),
        variacao_rs=round(revenue_change, CASAS_DECIMAIS),
        variacao_pct=change_pct,
        volume_base_kwh=round(sum(segment.volume_base_kwh for segment in segments), CASAS_DECIMAIS),
        volume_atual_kwh=round(sum(segment.volume_atual_kwh for segment in segments), CASAS_DECIMAIS),
        efeito_preco_rs=round(total_effects.preco_rs, CASAS_DECIMAIS),
        efeito_volume_rs=round(volume_effect, CASAS_DECIMAIS),
        efeito_mix_rs=round(mix_effect, CASAS_DECIMAIS),
        efeito_cruzado_rs=round(total_effects.cruzado_rs, CASAS_DECIMAIS),
        segmentos=list(starmap(build_segment_dto, zip(segments, effects_by_segment, strict=True))),
    )