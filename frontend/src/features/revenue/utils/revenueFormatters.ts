const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const compactCurrencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1
})
const tariffFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 3,
  maximumFractionDigits: 3
})
const mwhFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })
const integerFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 })
const percentFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
  signDisplay: 'exceptZero'
})

const signedCurrencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  signDisplay: 'exceptZero'
})
const signedCompactCurrencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1,
  signDisplay: 'exceptZero'
})
const monthFormatter = new Intl.DateTimeFormat('pt-BR', { month: 'short', year: '2-digit', timeZone: 'UTC' })

const KWH_PER_MWH = 1000
const EMPTY_VALUE = '—'

/**
 * Formata valor monetário compacto para cards (ex.: "R$ 62,5 mil").
 *
 * @param value - Valor em R$ ou `null`.
 * @returns Texto em pt-BR ou "—" sem valor.
 */
export function formatCompactCurrency(value: number | null): string {
  return value === null ? EMPTY_VALUE : compactCurrencyFormatter.format(value)
}

/**
 * Formata valor monetário completo (ex.: "R$ 1.040,88").
 *
 * @param value - Valor em R$ ou `null`.
 * @returns Texto em pt-BR ou "—" sem valor.
 */
export function formatCurrency(value: number | null): string {
  return value === null ? EMPTY_VALUE : currencyFormatter.format(value)
}

/**
 * Formata a tarifa média com três casas (ex.: "R$ 0,621 /kWh").
 *
 * @param value - Tarifa em R$/kWh ou `null`.
 * @returns Texto em pt-BR ou "—" sem valor.
 */
export function formatTariff(value: number | null): string {
  return value === null ? EMPTY_VALUE : `${tariffFormatter.format(value)}/kWh`
}

/**
 * Converte kWh em MWh e formata (ex.: "100,6 MWh").
 *
 * @param kwh - Energia em kWh ou `null`.
 * @returns Texto em pt-BR ou "—" sem valor.
 */
export function formatMwh(kwh: number | null): string {
  return kwh === null ? EMPTY_VALUE : `${mwhFormatter.format(kwh / KWH_PER_MWH)} MWh`
}

/**
 * Formata um número inteiro em pt-BR (ex.: contagem de UCs).
 *
 * @param value - Quantidade ou `null`.
 * @returns Texto em pt-BR ou "—" sem valor.
 */
export function formatCount(value: number | null): string {
  return value === null ? EMPTY_VALUE : integerFormatter.format(value)
}

/**
 * Formata a variação percentual com sinal (ex.: "+2,0%", "-4,0%").
 *
 * @param pct - Variação em pontos percentuais (já multiplicada por 100) ou `null`.
 * @returns Texto em pt-BR ou "—" sem base comparável.
 */
export function formatVariation(pct: number | null): string {
  return pct === null ? EMPTY_VALUE : `${percentFormatter.format(pct)}%`
}

/**
 * Formata valor monetário com sinal explícito (ex.: "+R$ 1.234,00", "-R$ 2.587,20").
 *
 * @param value - Valor em R$.
 * @returns Texto em pt-BR; zero fica sem sinal.
 */
export function formatSignedCurrency(value: number): string {
  return signedCurrencyFormatter.format(value)
}

/**
 * Formata valor monetário compacto com sinal explícito (ex.: "-R$ 2,6 mil").
 *
 * @param value - Valor em R$.
 * @returns Texto em pt-BR; zero fica sem sinal.
 */
export function formatSignedCompactCurrency(value: number): string {
  return signedCompactCurrencyFormatter.format(value)
}

/**
 * Converte uma competência `YYYY-MM` em rótulo curto (ex.: "2026-06" vira "jun. de 26").
 *
 * @param competencia - Competência no formato da API.
 * @returns Rótulo em pt-BR ou o texto original se não for uma competência válida.
 */
export function formatCompetencia(competencia: string): string {
  const parsed = new Date(`${competencia}-01T00:00:00Z`)
  return Number.isNaN(parsed.getTime()) ? competencia : monthFormatter.format(parsed)
}
