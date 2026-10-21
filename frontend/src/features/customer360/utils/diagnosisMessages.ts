import type { ConsumptionTrend, HighBillDiagnosis } from '@/features/customer360/types/customer360Types'
import {
  formatCompetencia,
  formatFlag,
  formatKwh,
  formatPercent
} from '@/features/customer360/utils/customer360Formatters'

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
