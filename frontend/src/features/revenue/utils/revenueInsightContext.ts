import type { PriceVolumeDecomposition, RevenueKpis, RevenueQuery } from '@/features/revenue/types/revenueTypes'

type InsightFilters = Record<string, string | number | null>
type InsightMetrics = Record<string, string | number>

const MILLION = 1_000_000

// `+ 0` troca o `-0` de quedas minúsculas por 0, para a métrica não sair como "-0".
const roundTo = (value: number, decimals: number) => Number(value.toFixed(decimals)) + 0

const describeWindow = (window: { inicio: string; fim: string }) => `${window.inicio} a ${window.fim}`

/**
 * Filtros que o Smart Insight recebe: as duas janelas comparadas e os recortes escolhidos na tela.
 *
 * @param query - Janelas base e atual e recortes ativos do dashboard.
 * @returns Mapa com as janelas e só os recortes preenchidos.
 */
export function buildInsightFilters(query: RevenueQuery): InsightFilters {
  const filters: InsightFilters = { base: describeWindow(query.base), atual: describeWindow(query.atual) }
  const { municipio, bairro, classe_consumo: classe } = query.filters
  if (municipio) filters.municipio = municipio
  if (bairro) filters.bairro = bairro
  if (classe) filters.classe_consumo = classe
  return filters
}

/**
 * Números que o Smart Insight pode citar: variações da receita, do volume e da tarifa e os quatro efeitos da ponte.
 * Valores em R$ vão em milhões e percentuais com uma casa, o formato em que o diretor lê a tela.
 *
 * @param decomposition - Decomposição preço × volume × mix da tela.
 * @param kpis - Indicadores nas duas janelas (volume e tarifa média).
 * @returns Mapa de métricas; variações sem base comparável ficam de fora.
 */
export function buildInsightMetrics(decomposition: PriceVolumeDecomposition, kpis: RevenueKpis): InsightMetrics {
  const metrics: InsightMetrics = {
    variacao_receita_mi_rs: roundTo(decomposition.variacao_rs / MILLION, 2),
    efeito_preco_mi_rs: roundTo(decomposition.efeito_preco_rs / MILLION, 2),
    efeito_volume_mi_rs: roundTo(decomposition.efeito_volume_rs / MILLION, 2),
    efeito_mix_mi_rs: roundTo(decomposition.efeito_mix_rs / MILLION, 2),
    efeito_cruzado_mi_rs: roundTo(decomposition.efeito_cruzado_rs / MILLION, 2)
  }
  const percentages: Array<[string, number | null]> = [
    ['variacao_receita_pct', decomposition.variacao_pct],
    ['variacao_volume_pct', kpis.volume_kwh.variacao_pct],
    ['variacao_tarifa_media_pct', kpis.tarifa_media_rs_kwh.variacao_pct]
  ]
  for (const [name, value] of percentages) {
    if (value !== null) metrics[name] = roundTo(value, 1)
  }
  return metrics
}
