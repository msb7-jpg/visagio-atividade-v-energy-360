import type { InsightHighlight } from '@/features/insights/api/insightsApi'

const LOCALE = 'pt-BR'
const MILLION = 1_000_000

const decimal = (value: number, digits = 1) =>
  value.toLocaleString(LOCALE, { minimumFractionDigits: 0, maximumFractionDigits: digits })

const signed = (value: number, text: string) => (value > 0 ? `+${text}` : text)

const oneDecimal = (value: number) =>
  value.toLocaleString(LOCALE, { minimumFractionDigits: 1, maximumFractionDigits: 1 })

function formatMoney(value: number): string {
  if (Math.abs(value) >= MILLION) return `R$ ${decimal(value / MILLION)} mi`
  return value.toLocaleString(LOCALE, { style: 'currency', currency: 'BRL' })
}

function formatEnergy(value: number): string {
  if (Math.abs(value) >= MILLION) return `${decimal(value / MILLION)} GWh`
  return `${decimal(value, 0)} kWh`
}

const FORMATTERS: Record<string, (value: number, isVariation: boolean) => string> = {
  rs: (value) => formatMoney(value),
  rs_kwh: (value) => `R$ ${decimal(value, 3)}/kWh`,
  kwh: (value) => formatEnergy(value),
  pct: (value, isVariation) => (isVariation ? signed(value, `${oneDecimal(value)}%`) : `${oneDecimal(value)}%`),
  pp: (value) => signed(value, `${oneDecimal(value)} p.p.`),
  horas: (value) => `${decimal(value)} h`,
  vezes: (value) => `${decimal(value)} vezes`,
  ucs: (value) => decimal(value, 0),
  nota: (value) => decimal(value)
}

/**
 * Formata o número de destaque do insight pela unidade que o servidor indicou.
 *
 * @param highlight - Destaque devolvido pela API, com o valor copiado das métricas do servidor.
 * @returns Texto pronto para exibir (ex.: `R$ 172,2 mi`, `+7,98%`, `1,7 h`).
 */
export function formatHighlight({ valor, unidade, metrica }: InsightHighlight): string {
  if (typeof valor === 'string') return valor
  const formatter = unidade ? FORMATTERS[unidade] : undefined
  return formatter ? formatter(valor, metrica.includes('var')) : decimal(valor, 2)
}
