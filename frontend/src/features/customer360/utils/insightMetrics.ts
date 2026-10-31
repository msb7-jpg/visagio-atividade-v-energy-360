import type {
  CustomerEventTimeline,
  CustomerHistory,
  HighBillDiagnosis,
  SolarGeneration,
  YearOverYearTotals
} from '@/features/customer360/types/customer360Types'

type InsightMetrics = Record<string, string | number>
type MetricValue = string | number | boolean | null

const DIAGNOSIS_FIELDS: [string, keyof HighBillDiagnosis][] = [
  ['competencia_referencia', 'competencia_referencia'],
  ['consumo_kwh_mes', 'consumo_kwh'],
  ['consumo_kwh_mesmo_mes_ano_anterior', 'consumo_kwh_ano_anterior'],
  ['variacao_consumo_pct', 'variacao_consumo_pct'],
  ['tendencia_consumo', 'tendencia_consumo'],
  ['variacao_tarifa_pct', 'variacao_tarifa_pct'],
  ['bandeira_atual', 'bandeira_atual'],
  ['bandeira_ano_anterior', 'bandeira_ano_anterior'],
  ['dias_faturamento', 'dias_faturamento'],
  ['dias_faturamento_ano_anterior', 'dias_faturamento_ano_anterior'],
  ['leitura_estimada', 'leitura_estimada']
]

const TOTALS_FIELDS: [string, keyof YearOverYearTotals][] = [
  ['consumo_12_meses_kwh', 'consumo_kwh'],
  ['consumo_12_meses_ano_anterior_kwh', 'consumo_kwh_ano_anterior'],
  ['variacao_consumo_12_meses_pct', 'variacao_consumo_pct']
]

function toMetric(value: MetricValue): string | number | null {
  if (typeof value === 'boolean') return value ? 'sim' : 'não'
  return value
}

function copyFields<T extends object>(metrics: InsightMetrics, source: T | null, fields: [string, keyof T][]): void {
  if (!source) return
  for (const [metricName, field] of fields) {
    const value = toMetric(source[field] as MetricValue)
    if (value !== null) metrics[metricName] = value
  }
}

/**
 * Monta as métricas da UC enviadas ao insight de IA, só com valores que a tela já mostra.
 * O servidor descarta qualquer frase do insight com número que não esteja aqui (verificação de fidelidade).
 *
 * @param history - Histórico de consumo, faturas e diagnóstico da conta alta.
 * @param events - Interrupções, chamados e inspeções da UC.
 * @param solar - Se a UC tem geração solar.
 * @returns Mapa de métricas sem valores vazios.
 */
export function buildCustomerInsightMetrics(
  history: CustomerHistory,
  events: CustomerEventTimeline,
  solar: SolarGeneration
): InsightMetrics {
  const metrics: InsightMetrics = {
    faturas_em_aberto: history.faturas_em_aberto.length,
    valor_em_aberto_rs: history.valor_em_aberto_rs,
    interrupcoes_da_uc: events.resumo_interrupcoes_uc.total_interrupcoes,
    horas_sem_energia_da_uc: events.resumo_interrupcoes_uc.total_horas,
    chamados: events.chamados.length,
    inspecoes_de_perdas: events.inspecoes.length,
    possui_painel_solar: toMetric(solar.hasSolar) as string
  }
  copyFields(metrics, history.diagnostico, DIAGNOSIS_FIELDS)
  copyFields(metrics, history.resumo_12_meses, TOTALS_FIELDS)
  return metrics
}
