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

const TREND_VERBS: Record<Exclude<ConsumptionTrend, 'SEM_COMPARACAO'>, string> = {
  SUBIU: 'subiu',
  ESTAVEL: 'ficou estável',
  CAIU: 'caiu'
}

/**
 * Frase que responde ao cliente se o consumo do mês de referência realmente subiu.
 *
 * @param diagnosis - Diagnóstico de conta alta retornado por `/history`.
 * @returns Frase sobre a variação do consumo contra o mesmo mês do ano anterior.
 */
export function describeConsumption(diagnosis: HighBillDiagnosis): string {
  const currentMonth = formatCompetencia(diagnosis.competencia_referencia)
  const previousMonth = formatCompetencia(diagnosis.competencia_comparada)
  if (diagnosis.tendencia_consumo === 'SEM_COMPARACAO') {
    return `Não há leitura de ${previousMonth} para comparar com ${currentMonth}.`
  }
  const variation = formatPercent(diagnosis.variacao_consumo_pct)
  const readings = `${formatKwh(diagnosis.consumo_kwh)} vs ${formatKwh(diagnosis.consumo_kwh_ano_anterior)}`
  return `O consumo de ${currentMonth} ${TREND_VERBS[diagnosis.tendencia_consumo]} (${variation}) em relação a ${previousMonth}: ${readings}.`
}

/**
 * Frase sobre período de faturamento diferente, que muda o total sem mudar o consumo por dia.
 *
 * @param diagnosis - Diagnóstico de conta alta retornado por `/history`.
 * @returns Frase com dias faturados e média diária, ou null quando os períodos têm a mesma duração.
 */
export function describeBillingDays(diagnosis: HighBillDiagnosis): string | null {
  const currentDays = diagnosis.dias_faturamento
  const previousDays = diagnosis.dias_faturamento_ano_anterior
  if (currentDays === null || previousDays === null || currentDays === previousDays) {
    return null
  }
  const dailyTrend = diagnosis.tendencia_media_diaria === 'SEM_COMPARACAO' ? 'não pôde ser comparado' : TREND_VERBS[diagnosis.tendencia_media_diaria]
  const dailyReadings = `${formatDailyKwh(diagnosis.media_diaria_kwh)} vs ${formatDailyKwh(diagnosis.media_diaria_kwh_ano_anterior)}`
  return `Este período teve ${currentDays} dias de faturamento contra ${previousDays}; por dia, o consumo ${dailyTrend} (${dailyReadings}).`
}

/**
 * Frase sobre a mudança de bandeira tarifária, que encarece a conta sem mudar o consumo.
 *
 * @param diagnosis - Diagnóstico de conta alta retornado por `/history`.
 * @returns Frase da bandeira, ou null quando ela não mudou.
 */
export function describeFlagChange(diagnosis: HighBillDiagnosis): string | null {
  if (!diagnosis.bandeira_mudou) {
    return null
  }
  const previousFlag = formatFlag(diagnosis.bandeira_ano_anterior)
  const currentFlag = formatFlag(diagnosis.bandeira_atual)
  return `A bandeira tarifária mudou de ${previousFlag} para ${currentFlag}, o que altera o valor da conta mesmo sem mudar o consumo.`
}

/**
 * Frase sobre a variação do preço médio do kWh (reajuste, bandeira e tributos somados).
 *
 * @param diagnosis - Diagnóstico de conta alta retornado por `/history`.
 * @returns Frase do preço do kWh, ou null quando a variação é desprezível ou não há fatura para comparar.
 */
export function describeTariffChange(diagnosis: HighBillDiagnosis): string | null {
  const variation = diagnosis.variacao_tarifa_pct
  if (variation === null || Math.abs(variation) < MIN_TARIFF_CHANGE_PCT) {
    return null
  }
  const direction = variation > 0 ? 'subiu' : 'caiu'
  const prices = `${formatTariff(diagnosis.tarifa_rs_kwh)} vs ${formatTariff(diagnosis.tarifa_rs_kwh_ano_anterior)}`
  return `O preço médio do kWh ${direction} ${formatPercentMagnitude(variation)} (${prices}), somando reajuste, bandeira e tributos.`
}
