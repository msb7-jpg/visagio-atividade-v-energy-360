import type { BreakdownRow, NeighborhoodRef } from '@/features/revenue/types/revenueTypes'
import { displayName } from '@/lib/geo/placeName'

/** Receita, volume e tarifa média de um bairro ou município na janela atual, com a variação contra a base. */
export interface AreaRevenue {
  key: string
  name: string
  /** Município do bairro; nulo na visão por município. */
  place: string | null
  /** Bairro que abre o histórico mensal; nulo na visão por município. */
  neighborhood: NeighborhoodRef | null
  revenue: number
  revenueBase: number
  revenuePct: number | null
  volumeKwh: number
  /** Receita dividida pelo volume (R$/kWh), a mesma conta da tarifa média geral. */
  tariff: number | null
  tariffPct: number | null
}

export type AreaSortField = 'revenue' | 'revenuePct' | 'volumeKwh' | 'tariff'

const percentChange = (current: number | null, base: number | null) =>
  current !== null && base !== null && base !== 0 ? ((current - base) / base) * 100 : null

const tariffOf = (revenue: number, volumeKwh: number) => (volumeKwh > 0 ? revenue / volumeKwh : null)

/**
 * Converte uma linha do ranking em receita, volume e tarifa média da área.
 *
 * @param row - Linha do ranking (bairro ou município).
 * @returns Valores da janela atual e variações contra a janela base.
 */
export function toAreaRevenue(row: BreakdownRow): AreaRevenue {
  const isNeighborhood = Boolean(row.bairro && row.municipio)
  const tariff = tariffOf(row.receita_atual_rs, row.volume_atual_kwh)
  return {
    key: `${row.municipio ?? ''}|${row.bairro ?? ''}`,
    name: displayName((isNeighborhood ? row.bairro : row.municipio) ?? '—'),
    place: isNeighborhood && row.municipio ? displayName(row.municipio) : null,
    neighborhood: isNeighborhood && row.municipio && row.bairro ? { municipio: row.municipio, bairro: row.bairro } : null,
    revenue: row.receita_atual_rs,
    revenueBase: row.receita_base_rs,
    revenuePct: percentChange(row.receita_atual_rs, row.receita_base_rs),
    volumeKwh: row.volume_atual_kwh,
    tariff,
    tariffPct: percentChange(tariff, tariffOf(row.receita_base_rs, row.volume_base_kwh))
  }
}

const normalize = (text: string) =>
  text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

/**
 * Busca pelo nome (sem acento e sem diferenciar maiúsculas) e ordena do maior para o menor.
 *
 * @param areas - Bairros ou municípios.
 * @param search - Texto digitado; vazio mantém todos.
 * @param field - Coluna da ordenação.
 * @returns Lista filtrada e ordenada; valores ausentes vão para o fim.
 */
export function searchAndSort(areas: AreaRevenue[], search: string, field: AreaSortField): AreaRevenue[] {
  const term = normalize(search.trim())
  const matches = term
    ? areas.filter((area) => normalize(`${area.name} ${area.place ?? ''}`).includes(term))
    : areas
  return [...matches].sort((left, right) => (right[field] ?? Number.NEGATIVE_INFINITY) - (left[field] ?? Number.NEGATIVE_INFINITY))
}
