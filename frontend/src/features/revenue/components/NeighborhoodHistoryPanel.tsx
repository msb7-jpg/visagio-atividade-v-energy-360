import { useState } from 'react'
import { BarChart3, History } from 'lucide-react'
import type { UseQueryResult } from '@tanstack/react-query'
import { AsyncState } from '@/components/feedback/AsyncState'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MonthlyBarChart } from '@/features/revenue/components/MonthlyBarChart'
import type { NeighborhoodHistory, NeighborhoodRef } from '@/features/revenue/types/revenueTypes'
import { HISTORY_METRICS, type HistoryMetricKey } from '@/features/revenue/utils/revenueHistoryMetrics'
import { getRevenueErrorMessage } from '@/features/revenue/utils/revenueErrorMessage'

interface NeighborhoodHistoryPanelProps {
  neighborhood: NeighborhoodRef | null
  historyQuery: UseQueryResult<NeighborhoodHistory>
}

/**
 * Painel persistente com o histórico mensal (receita, volume ou tarifa) do bairro selecionado.
 *
 * @param props - Bairro selecionado e consulta com o histórico de 24 meses.
 * @returns Painel lateral com abas de métrica e gráfico de barras persistente.
 */
export function NeighborhoodHistoryPanel({ neighborhood, historyQuery }: NeighborhoodHistoryPanelProps) {
  const [metricKey, setMetricKey] = useState<HistoryMetricKey>('receita_rs')
  const metric = HISTORY_METRICS.find((candidate) => candidate.key === metricKey) ?? HISTORY_METRICS[0]
  const history = historyQuery.data
  const points = history?.pontos ?? []

  if (!neighborhood) {
    return (
      <div className="bg-card border-border flex h-full min-h-80 flex-col items-center justify-center gap-2 rounded-lg border p-6 text-center">
        <BarChart3 className="text-muted-foreground size-10" />
        <span className="text-foreground text-sm font-medium">Selecione um bairro na tabela</span>
        <span className="text-muted-foreground text-xs">Clique em qualquer linha da tabela para ver o histórico de 24 meses.</span>
      </div>
    )
  }

  return (
    <div className="bg-card border-border flex h-full flex-col justify-between gap-4 rounded-lg border p-4">
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-foreground text-sm font-semibold tracking-tight">{neighborhood.bairro}</span>
          <span className="text-muted-foreground text-xs">{neighborhood.municipio}</span>
        </div>
        <span className="text-muted-foreground text-xs">Histórico dos últimos 24 meses</span>
      </div>

      <Tabs value={metricKey} onValueChange={(next) => setMetricKey(next as HistoryMetricKey)}>
        <TabsList className="w-full">
          {HISTORY_METRICS.map((option) => (
            <TabsTrigger key={option.key} value={option.key} className="flex-1">
              {option.tabLabel}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex-1">
        <AsyncState
          isLoading={historyQuery.isLoading}
          isError={historyQuery.isError}
          isEmpty={history !== undefined && points.length === 0}
          errorTitle="Não foi possível carregar o histórico"
          errorDescription={getRevenueErrorMessage(historyQuery.error)}
          onRetry={() => void historyQuery.refetch()}
          emptyTitle="Sem histórico para este bairro"
          emptyIcon={<History className="size-8" />}
        >
          {points.length > 0 ? <MonthlyBarChart points={points} metric={metric} /> : null}
        </AsyncState>
      </div>
    </div>
  )
}
