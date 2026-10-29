import type { IndicatorUnit } from '@/features/executive_dashboard/types/executiveDashboardTypes'

const EMPTY_VALUE = '—'

const UNIT_FORMATTERS: Record<IndicatorUnit, (value: number) => string> = {
  RS: (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(value),
  KWH: (value) => `${new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }).format(value)} kWh`,
  RS_KWH: (value) =>
    `${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 4 }).format(value)}/kWh`,
  UCS: (value) => `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(value)} UCs`,
  PCT: (value) => `${new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value)}%`,
  NOTA: (value) => `${new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)} / 5`,
  HORAS: (value) => `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(value)} h`,
  VEZES: (value) => `${new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)} vezes`
}

const variationFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1, signDisplay: 'exceptZero' })

/**
 * Formata o valor do indicador pela unidade do contrato.
 *
 * @param value - Valor da janela, ou `null` quando não há como calcular.
 * @param unit - Unidade devolvida pela API.
 * @returns Texto como "R$ 92 mi", "8,1%" ou travessão.
 */
export function formatIndicatorValue(value: number | null, unit: IndicatorUnit): string {
  return value === null ? EMPTY_VALUE : UNIT_FORMATTERS[unit](value)
}

/**
 * Formata a variação percentual com sinal.
 *
 * @param variationPct - Variação em %, ou `null` sem base para comparar.
 * @returns Texto como "+8%", "−3,8%" ou travessão.
 */
export function formatVariation(variationPct: number | null): string {
  return variationPct === null ? EMPTY_VALUE : `${variationFormatter.format(variationPct)}%`
}

/**
 * Formata a variação do indicador: pontos percentuais nas taxas, variação relativa nos demais.
 *
 * @param variationPct - Variação relativa em %.
 * @param variationPoints - Diferença em pontos percentuais, só nos indicadores em %.
 * @returns Texto como "+8%", "+0,05 p.p." ou "−3,1 p.p.".
 */
export function formatIndicatorChange(variationPct: number | null, variationPoints: number | null): string {
  if (variationPoints === null) {
    return formatVariation(variationPct)
  }
  const points = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
    signDisplay: 'exceptZero'
  }).format(variationPoints)
  return `${points} p.p.`
}

/**
 * Formata energia mensal com separador de milhar.
 *
 * @param kwh - Energia em kWh/mês.
 * @returns Texto como "182.000 kWh/mês".
 */
export function formatMonthlyKwh(kwh: number): string {
  return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(kwh)} kWh/mês`
}
