import { useState } from 'react'
import type { MonthlyPoint } from '@/features/revenue/types/revenueTypes'
import type { AreaRevenue } from '@/features/revenue/utils/areaRevenue'
import { HISTORY_METRICS, type HistoryMetric, type HistoryMetricKey } from '@/features/revenue/utils/revenueHistoryMetrics'

/** Máximo de bairros no gráfico: um por cor de série (`--chart-1` a `--chart-5`). */
export const MAX_COMPARED_AREAS = 5
const DEFAULT_COMPARED_AREAS = 3

export interface ComparedArea {
  key: string
  name: string
  points: MonthlyPoint[]
}

/**
 * Estado do gráfico de comparação: a métrica e os bairros escolhidos entre os que já têm série carregada.
 * Sem escolha (ou com a escolha fora da página atual), compara os primeiros bairros da lista.
 *
 * @param areas - Bairros da página atual da tabela.
 * @param histories - Séries mensais já consultadas, por `município|bairro`.
 * @returns Métrica, bairros disponíveis e escolhidos, e as ações que os alteram.
 */
export function useAreaComparison(areas: AreaRevenue[], histories: Map<string, MonthlyPoint[]>) {
  const [metricKey, setMetricKey] = useState<HistoryMetricKey>('receita_rs')
  const [chosen, setChosen] = useState<string[]>([])
  const options: ComparedArea[] = areas.flatMap((area) => {
    const points = histories.get(area.key)
    return area.neighborhood && points ? [{ key: area.key, name: area.place ? `${area.name} (${area.place})` : area.name, points }] : []
  })
  const stillVisible = chosen.filter((key) => options.some((option) => option.key === key))
  const selectedKeys = stillVisible.length > 0 ? stillVisible : options.slice(0, DEFAULT_COMPARED_AREAS).map((option) => option.key)

  const toggle = (key: string) =>
    setChosen(selectedKeys.includes(key) ? selectedKeys.filter((selected) => selected !== key) : [...selectedKeys, key])

  return {
    metric: HISTORY_METRICS.find((candidate) => candidate.key === metricKey) as HistoryMetric,
    changeMetric: setMetricKey,
    options,
    selectedKeys,
    selected: options.filter((option) => selectedKeys.includes(option.key)),
    toggle
  }
}
