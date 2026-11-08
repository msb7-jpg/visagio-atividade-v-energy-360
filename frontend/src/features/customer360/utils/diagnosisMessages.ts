import type { ConsumptionTrend, HighBillDiagnosis } from '@/features/customer360/types/customer360Types'
import {
  formatCompetencia,
  formatDailyKwh,
  formatFlag,
  formatKwh,
  formatPercent,
  formatPercentMagnitude,
  formatTariff
} from '@/features/customer360/utils/customer360Formatters'

const MIN_TARIFF_CHANGE_PCT = 1
const MIN_BILLING_DAYS_GAP = 3
const FLAG_COST_ORDER = ['VERDE', 'AMARELA', 'VERMELHA_P1', 'VERMELHA_P2']

/** Causa curta para o chip (`label`) e o texto de uma frase para o tooltip (`detail`). */
export interface Explanation {
  label: string
  detail: string
}

const TREND_VERBS: Record<Exclude<ConsumptionTrend, 'SEM_COMPARACAO'>, string> = {
  SUBIU: 'subiu',
  ESTAVEL: 'ficou estável',
  CAIU: 'caiu'
}

/**
 * Linha de apoio do veredito: quais meses e quais consumos foram comparados.
 *
 * @param diagnosis - Diagnóstico de conta alta retornado por `/history`.
 * @returns Texto como "jun/2026 vs jun/2025: 240 kWh vs 200 kWh", ou o aviso de leitura que falta.
 */
export function describeConsumption(diagnosis: HighBillDiagnosis): string {
  const currentMonth = formatCompetencia(diagnosis.competencia_referencia)
  const previousMonth = formatCompetencia(diagnosis.competencia_comparada)
  if (diagnosis.tendencia_consumo === 'SEM_COMPARACAO') {
    const missingMonth = diagnosis.consumo_kwh === null ? currentMonth : previousMonth
    const otherMonth = diagnosis.consumo_kwh === null ? previousMonth : currentMonth
    return `Sem leitura de ${missingMonth} para comparar com ${otherMonth}.`
  }
  return `${currentMonth} vs ${previousMonth}: ${formatKwh(diagnosis.consumo_kwh)} vs ${formatKwh(diagnosis.consumo_kwh_ano_anterior)}`
}

/**
 * Período de faturamento diferente, que muda o total sem mudar o consumo por dia.
 * Só aparece quando a diferença é de pelo menos 3 dias e muda a conclusão (ex: total subiu, mas por dia ficou estável).
 *
 * @param diagnosis - Diagnóstico de conta alta retornado por `/history`.
 * @returns Dias faturados e média diária, ou null quando os dias não explicam a variação.
 */
export function describeBillingDays(diagnosis: HighBillDiagnosis): Explanation | null {
  const currentDays = diagnosis.dias_faturamento
  const previousDays = diagnosis.dias_faturamento_ano_anterior
  const dailyTrend = diagnosis.tendencia_media_diaria
  if (currentDays === null || previousDays === null || dailyTrend === 'SEM_COMPARACAO') {
    return null
  }
  const hasRelevantGap = Math.abs(currentDays - previousDays) >= MIN_BILLING_DAYS_GAP
  if (!hasRelevantGap || dailyTrend === diagnosis.tendencia_consumo) {
    return null
  }
  const dailyReadings = `${formatDailyKwh(diagnosis.media_diaria_kwh)} vs ${formatDailyKwh(diagnosis.media_diaria_kwh_ano_anterior)}`
  return {
    label: `${currentDays} dias faturados (antes ${previousDays})`,
    detail: `Por dia, o consumo ${TREND_VERBS[dailyTrend]}: ${dailyReadings}.`
  }
}

/**
 * Mudança de bandeira tarifária, dizendo se ela encareceu ou barateou a conta sem mudar o consumo.
 *
 * @param diagnosis - Diagnóstico de conta alta retornado por `/history`.
 * @returns Bandeira antes e depois, ou null quando ela não mudou.
 */
export function describeFlagChange(diagnosis: HighBillDiagnosis): Explanation | null {
  if (!diagnosis.bandeira_mudou) {
    return null
  }
  const label = `Bandeira: ${formatFlag(diagnosis.bandeira_ano_anterior)} → ${formatFlag(diagnosis.bandeira_atual)}`
  const isMoreExpensive = FLAG_COST_ORDER.indexOf(diagnosis.bandeira_atual ?? '') > FLAG_COST_ORDER.indexOf(diagnosis.bandeira_ano_anterior ?? '')
  return {
    label,
    detail: isMoreExpensive ? 'Bandeira mais cara: encarece a conta mesmo sem mais consumo.' : 'Bandeira mais barata: reduz o valor da conta.'
  }
}

/**
 * Variação do preço médio do kWh (reajuste, bandeira e tributos somados).
 *
 * @param diagnosis - Diagnóstico de conta alta retornado por `/history`.
 * @returns Variação do preço do kWh, ou null quando é desprezível ou não há fatura para comparar.
 */
export function describeTariffChange(diagnosis: HighBillDiagnosis): Explanation | null {
  const variation = diagnosis.variacao_tarifa_pct
  if (variation === null || Math.abs(variation) < MIN_TARIFF_CHANGE_PCT) {
    return null
  }
  const direction = variation > 0 ? 'subiu' : 'caiu'
  const prices = `${formatTariff(diagnosis.tarifa_rs_kwh)} vs ${formatTariff(diagnosis.tarifa_rs_kwh_ano_anterior)}`
  return {
    label: `Preço do kWh ${formatPercent(variation)}`,
    detail: `O preço médio do kWh ${direction} ${formatPercentMagnitude(variation)} (${prices}), com reajuste, bandeira e tributos.`
  }
}

/**
 * Leitura do mês de referência estimada pela média, sem o leiturista acessar o medidor.
 *
 * @param diagnosis - Diagnóstico de conta alta retornado por `/history`.
 * @returns Aviso da leitura estimada, ou null quando a leitura foi real.
 */
export function describeEstimatedReading(diagnosis: HighBillDiagnosis): Explanation | null {
  if (!diagnosis.leitura_estimada) {
    return null
  }
  return {
    label: 'Leitura estimada',
    detail: `A leitura de ${formatCompetencia(diagnosis.competencia_referencia)} foi estimada pela média; a diferença é acertada na próxima leitura.`
  }
}

/**
 * Efeito da geração solar, destacando quando o painel foi ligado entre os dois meses comparados.
 *
 * @param diagnosis - Diagnóstico de conta alta retornado por `/history`.
 * @param solarConnectedAt - Data de ligação da geração própria ('YYYY-MM-DD'), ou null se não informada.
 * @returns Aviso da geração solar.
 */
export function describeSolar(diagnosis: HighBillDiagnosis, solarConnectedAt: string | null): Explanation {
  const connectionMonth = solarConnectedAt?.slice(0, 7)
  const isBetweenCompared = connectionMonth !== undefined
    && connectionMonth > diagnosis.competencia_comparada
    && connectionMonth <= diagnosis.competencia_referencia
  if (!isBetweenCompared) {
    return { label: 'Geração solar', detail: 'A energia gerada é abatida do consumo faturado.' }
  }
  return {
    label: `Painel solar desde ${formatCompetencia(connectionMonth)}`,
    detail: `O painel foi ligado depois de ${formatCompetencia(diagnosis.competencia_comparada)}: a energia gerada é abatida, então o consumo faturado tende a cair.`
  }
}
