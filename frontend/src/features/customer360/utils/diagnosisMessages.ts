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
 * Só aparece quando a diferença é de pelo menos 3 dias e muda a conclusão (ex: total subiu, mas por dia ficou estável).
 *
 * @param diagnosis - Diagnóstico de conta alta retornado por `/history`.
 * @returns Frase com dias faturados e média diária, ou null quando os dias não explicam a variação.
 */
export function describeBillingDays(diagnosis: HighBillDiagnosis): string | null {
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
  return `Este período teve ${currentDays} dias de faturamento contra ${previousDays}; por dia, o consumo ${TREND_VERBS[dailyTrend]} (${dailyReadings}).`
}

/**
 * Frase sobre a mudança de bandeira tarifária, dizendo se ela encareceu ou barateou a conta sem mudar o consumo.
 *
 * @param diagnosis - Diagnóstico de conta alta retornado por `/history`.
 * @returns Frase da bandeira, ou null quando ela não mudou.
 */
export function describeFlagChange(diagnosis: HighBillDiagnosis): string | null {
  if (!diagnosis.bandeira_mudou) {
    return null
  }
  const flags = `de ${formatFlag(diagnosis.bandeira_ano_anterior)} para ${formatFlag(diagnosis.bandeira_atual)}`
  const isMoreExpensive = FLAG_COST_ORDER.indexOf(diagnosis.bandeira_atual ?? '') > FLAG_COST_ORDER.indexOf(diagnosis.bandeira_ano_anterior ?? '')
  return isMoreExpensive
    ? `A bandeira tarifária ficou mais cara (${flags}), o que encarece a conta mesmo sem aumento de consumo.`
    : `A bandeira tarifária ficou mais barata (${flags}), o que reduz o valor da conta.`
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

/**
 * Frase sobre a leitura do mês de referência ter sido estimada pela média, sem o leiturista acessar o medidor.
 *
 * @param diagnosis - Diagnóstico de conta alta retornado por `/history`.
 * @returns Frase da leitura estimada, ou null quando a leitura foi real.
 */
export function describeEstimatedReading(diagnosis: HighBillDiagnosis): string | null {
  if (!diagnosis.leitura_estimada) {
    return null
  }
  const month = formatCompetencia(diagnosis.competencia_referencia)
  return `A leitura de ${month} foi estimada pela média, sem leitura no medidor; a diferença para o consumo real é acertada na próxima leitura.`
}

/**
 * Frase sobre o efeito da geração solar, destacando quando o painel foi ligado entre os dois meses comparados.
 *
 * @param diagnosis - Diagnóstico de conta alta retornado por `/history`.
 * @param solarConnectedAt - Data de ligação da geração própria ('YYYY-MM-DD'), ou null se não informada.
 * @returns Frase da geração solar.
 */
export function describeSolar(diagnosis: HighBillDiagnosis, solarConnectedAt: string | null): string {
  const connectionMonth = solarConnectedAt?.slice(0, 7)
  const isBetweenCompared = connectionMonth !== undefined
    && connectionMonth > diagnosis.competencia_comparada
    && connectionMonth <= diagnosis.competencia_referencia
  if (!isBetweenCompared) {
    return 'A UC tem geração solar: a energia gerada é abatida do consumo faturado.'
  }
  const previousMonth = formatCompetencia(diagnosis.competencia_comparada)
  return `O painel solar foi ligado em ${formatCompetencia(connectionMonth)}, depois de ${previousMonth}: a energia gerada passou a ser abatida, então é esperado que o consumo faturado caia frente ao ano anterior.`
}
