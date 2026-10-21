import type { ConsumptionTrend } from '@/features/customer360/types/customer360Types'

const MONTH_ABBREVIATIONS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
const EMPTY_VALUE = '—'

const energyFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })
const moneyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const tariffFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 3 })
const magnitudeFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })
const percentFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1, signDisplay: 'exceptZero' })

export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline'

const FLAG_LABELS: Record<string, string> = {
  VERDE: 'Verde',
  AMARELA: 'Amarela',
  VERMELHA_P1: 'Vermelha P1',
  VERMELHA_P2: 'Vermelha P2'
}

export const TREND_LABELS: Record<ConsumptionTrend, string> = {
  SUBIU: 'Consumo subiu',
  ESTAVEL: 'Consumo estável',
  CAIU: 'Consumo caiu',
  SEM_COMPARACAO: 'Sem comparação com o ano anterior'
}

export const PAYMENT_STATUS: Record<string, { label: string, variant: BadgeVariant }> = {
  PAGA: { label: 'Paga', variant: 'secondary' },
  ABERTA: { label: 'Aberta', variant: 'outline' },
  VENCIDA: { label: 'Vencida', variant: 'destructive' }
}

/**
 * Formata energia em kWh no padrão brasileiro.
 *
 * @param kwh - Energia em kWh, ou null quando não há leitura.
 * @returns Texto como "1.234,5 kWh" ou travessão.
 */
export function formatKwh(kwh: number | null): string {
  return kwh === null ? EMPTY_VALUE : `${energyFormatter.format(kwh)} kWh`
}

/**
 * Formata uma quantidade (inteira ou média) com o substantivo no singular ou plural.
 *
 * @param count - Quantidade, ex: 1 ou 2,4.
 * @param singular - Palavra no singular, ex: "interrupção".
 * @param plural - Palavra no plural, ex: "interrupções".
 * @returns Texto como "1 interrupção" ou "2,4 interrupções".
 */
export function formatCount(count: number, singular: string, plural: string): string {
  return `${energyFormatter.format(count)} ${count === 1 ? singular : plural}`
}

/**
 * Formata o preço médio do kWh em reais.
 *
 * @param tariff - Preço em R$/kWh, ou null quando não há fatura.
 * @returns Texto como "R$ 0,88/kWh" ou travessão.
 */
export function formatTariff(tariff: number | null): string {
  return tariff === null ? EMPTY_VALUE : `${tariffFormatter.format(tariff)}/kWh`
}

/**
 * Formata consumo médio diário.
 *
 * @param dailyKwh - Consumo em kWh por dia, ou null sem leitura.
 * @returns Texto como "6,7 kWh/dia" ou travessão.
 */
export function formatDailyKwh(dailyKwh: number | null): string {
  return dailyKwh === null ? EMPTY_VALUE : `${energyFormatter.format(dailyKwh)} kWh/dia`
}

/**
 * Formata potência instalada em kW no padrão brasileiro.
 *
 * @param kilowatts - Potência em kW, ou null quando não informada.
 * @returns Texto como "4,5 kW" ou travessão.
 */
export function formatPower(kilowatts: number | null): string {
  return kilowatts === null ? EMPTY_VALUE : `${energyFormatter.format(kilowatts)} kW`
}

/**
 * Formata duração em horas no padrão brasileiro.
 *
 * @param hours - Duração em horas, ou null quando não apurada.
 * @returns Texto como "1,5 h" ou travessão.
 */
export function formatHours(hours: number | null): string {
  return hours === null ? EMPTY_VALUE : `${energyFormatter.format(hours)} h`
}

/**
 * Formata valor monetário em reais.
 *
 * @param amount - Valor em R$, ou null quando não há fatura.
 * @returns Texto como "R$ 176,00" ou travessão.
 */
export function formatMoney(amount: number | null): string {
  return amount === null ? EMPTY_VALUE : moneyFormatter.format(amount)
}

/**
 * Formata variação percentual com sinal.
 *
 * @param percent - Variação em pontos percentuais, ou null sem base de comparação.
 * @returns Texto como "+40%" ou travessão.
 */
export function formatPercent(percent: number | null): string {
  return percent === null ? EMPTY_VALUE : `${percentFormatter.format(percent)}%`
}

/**
 * Formata o tamanho de uma variação percentual, sem sinal, para frases que já dizem se subiu ou caiu.
 *
 * @param percent - Variação em pontos percentuais.
 * @returns Texto como "10%".
 */
export function formatPercentMagnitude(percent: number): string {
  return `${magnitudeFormatter.format(Math.abs(percent))}%`
}

/**
 * Converte a competência 'YYYY-MM' para o formato curto usado na tela.
 *
 * @param competencia - Mês de referência, ex: '2026-03'.
 * @returns Texto como "mar/2026".
 */
export function formatCompetencia(competencia: string): string {
  const [year, month] = competencia.split('-')
  return `${MONTH_ABBREVIATIONS[Number(month) - 1]}/${year}`
}

/**
 * Converte uma data 'YYYY-MM-DD' (ou data e hora) para o padrão brasileiro sem depender de fuso horário.
 *
 * @param isoDate - Data vinda da API, ou null.
 * @returns Texto como "20/03/2026" ou travessão.
 */
export function formatDate(isoDate: string | null): string {
  if (!isoDate) {
    return EMPTY_VALUE
  }
  const [year, month, day] = isoDate.slice(0, 10).split('-')
  return `${day}/${month}/${year}`
}

/**
 * Rótulo amigável da bandeira tarifária.
 *
 * @param flag - Código da bandeira vindo da API.
 * @returns Nome da bandeira ou travessão.
 */
export function formatFlag(flag: string | null): string {
  return flag ? FLAG_LABELS[flag] ?? flag : EMPTY_VALUE
}
