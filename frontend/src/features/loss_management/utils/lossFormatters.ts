import type { SuspicionReason } from '@/features/loss_management/types/lossTypes'

const kwhFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })
const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const percentFormatter = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 1 })
const dateFormatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' })
const integerFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 })
const compactFormatter = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

const PERCENT_SCALE = 100
const THOUSAND = 1000
const MILLION = 1_000_000
const MONTH_ABBREVIATIONS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'] as const

export const REASON_LABELS: Record<SuspicionReason, string> = {
  queda_subita: 'Queda abrupta de consumo',
  queda_moderada: 'Queda moderada de consumo',
  leitura_zerada: 'Consumo zero com medidor ativo'
}

/** Tipos de irregularidade registrados historicamente pelas equipes de campo. */
export const IRREGULARITY_TYPES = [
  'BY-PASS',
  'DESVIO DIRETO',
  'LACRE VIOLADO',
  'LIGACAO CLANDESTINA',
  'MEDIDOR ADULTERADO'
] as const

/**
 * Formata energia em kWh no padrão brasileiro.
 *
 * @param kwh - Energia em kWh.
 * @returns Texto como "22.426,2 kWh".
 */
export function formatKwh(kwh: number): string {
  return `${kwhFormatter.format(kwh)} kWh`
}

/**
 * Formata valor monetário em reais.
 *
 * @param value - Valor em R$.
 * @returns Texto como "R$ 19.062,27".
 */
export function formatCurrency(value: number): string {
  return currencyFormatter.format(value)
}

/**
 * Formata uma fração como porcentagem no padrão brasileiro.
 *
 * @param fraction - Valor entre 0 e 1.
 * @returns Texto como "93%" ou "62,7%".
 */
export function formatPercent(fraction: number): string {
  return percentFormatter.format(fraction)
}

/**
 * Formata a queda do consumo recente frente ao consumo base da UC.
 *
 * @param baseKwh - Consumo médio mensal das 12 competências de base.
 * @param recentKwh - Consumo médio mensal das 3 últimas competências.
 * @returns Texto como "−33%", "0%" sem queda ou "—" quando não há consumo base.
 */
export function formatConsumptionDrop(baseKwh: number, recentKwh: number): string {
  if (baseKwh <= 0) return '—'
  const drop = Math.max(0, 1 - recentKwh / baseKwh)
  return drop === 0 ? '0%' : `−${integerFormatter.format(drop * PERCENT_SCALE)}%`
}

/**
 * Formata data ISO para dd/mm/aaaa.
 *
 * @param isoDate - Data em ISO 8601.
 * @returns Data curta em pt-BR.
 */
export function formatDate(isoDate: string): string {
  return dateFormatter.format(new Date(isoDate))
}

/**
 * Descreve os motivos de suspeita em texto para a ordem de inspeção.
 *
 * @param reasons - Motivos calculados pelo backend.
 * @returns Motivos legíveis separados por vírgula.
 */
export function describeReasons(reasons: SuspicionReason[]): string {
  return reasons.map((reason) => REASON_LABELS[reason]).join(', ')
}

/**
 * Formata um número inteiro com separador de milhar.
 *
 * @param value - Quantidade.
 * @returns Texto como "1.248".
 */
export function formatInteger(value: number): string {
  return integerFormatter.format(value)
}

/**
 * Formata valor em reais de forma compacta para os cartões e a tabela.
 *
 * @param value - Valor em R$.
 * @returns Texto como "R$ 15,8 mil", "R$ 1,2 mi" ou "R$ 535".
 */
export function formatCompactCurrency(value: number): string {
  if (value >= MILLION) return `R$ ${compactFormatter.format(value / MILLION)} mi`
  if (value >= THOUSAND) return `R$ ${compactFormatter.format(value / THOUSAND)} mil`
  return `R$ ${integerFormatter.format(value)}`
}

/**
 * Formata o período de um histórico a partir de duas competências.
 *
 * @param start - Primeira competência ('YYYY-MM').
 * @param end - Última competência ('YYYY-MM').
 * @returns Texto como "ago–dez/2025" ou "nov/2025–fev/2026".
 */
export function formatPeriod(start: string, end: string): string {
  const [startYear, startMonth] = start.split('-')
  const [endYear, endMonth] = end.split('-')
  const startLabel = MONTH_ABBREVIATIONS[Number(startMonth) - 1]
  const endLabel = MONTH_ABBREVIATIONS[Number(endMonth) - 1]
  return startYear === endYear ? `${startLabel}–${endLabel}/${endYear}` : `${startLabel}/${startYear}–${endLabel}/${endYear}`
}

/**
 * Concorda "ordem" com a quantidade.
 *
 * @param count - Quantidade de ordens.
 * @returns "ordem" para 1 e "ordens" nos demais casos.
 */
export function ordersLabel(count: number): string {
  return count === 1 ? 'ordem' : 'ordens'
}
