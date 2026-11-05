import { apiClient } from '@/lib/api-client'

export interface ProactiveInsightsPayload {
  context: 'customer360' | 'revenue' | 'losses' | 'quality' | 'executive'
  filtros?: Record<string, string | number | null>
  metricas?: Record<string, string | number>
}

export type InsightTone = 'positivo' | 'neutro' | 'atencao' | 'critico'

/** Número de destaque: a IA escolhe a métrica e o rótulo; o valor vem das métricas calculadas pelo servidor. */
export interface InsightHighlight {
  rotulo: string
  metrica: string
  valor: number | string
  unidade: string | null
}

export interface ProactiveInsightsData {
  resumo_executivo: string
  insights: string[]
  manchete?: string | null
  tom?: InsightTone
  destaques?: InsightHighlight[]
  acao_recomendada?: string | null
}

/**
 * Consulta a API de insights proativos baseada em contexto analítico.
 *
 * @param payload - Contexto de tela, filtros e métricas.
 * @param signal - Sinal de cancelamento AbortSignal.
 * @returns Resumo executivo e lista de achados.
 */
export async function fetchProactiveInsights(
  payload: ProactiveInsightsPayload,
  signal?: AbortSignal
): Promise<ProactiveInsightsData> {
  const response = await apiClient.post<ProactiveInsightsData>(
    '/ai/insights',
    payload,
    { signal }
  )
  return response.data
}
