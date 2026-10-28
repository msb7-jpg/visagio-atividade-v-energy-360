import { useState } from 'react'
import { History } from 'lucide-react'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MonthlyBarChart } from '@/features/revenue/components/MonthlyBarChart'
import { AsyncState } from '@/components/feedback/AsyncState'
import { getRevenueErrorMessage } from '@/features/revenue/utils/revenueErrorMessage'
import type { NeighborhoodHistory, NeighborhoodRef } from '@/features/revenue/types/revenueTypes'
import { HISTORY_METRICS } from '@/features/revenue/utils/revenueHistoryMetrics'
import type { HistoryMetricKey } from '@/features/revenue/utils/revenueHistoryMetrics'

interface NeighborhoodHistorySheetProps {
  neighborhood: NeighborhoodRef | null
  history: NeighborhoodHistory | undefined
  isLoading: boolean
  isError: boolean
  error: unknown
  onClose: () => void
}

/**
 * Gaveta lateral com a série mensal (receita, volume ou tarifa) do bairro escolhido no ranking.
 *
 * @param props - Bairro aberto, resultado da consulta do histórico e callback de fechamento.
 * @returns Gaveta com abas de métrica, gráfico de barras e estados de carregamento/erro/vazio.
 */
export function NeighborhoodHistorySheet(props: NeighborhoodHistorySheetProps) {
  const { neighborhood, history, isLoading, isError, error, onClose } = props
  const [metricKey, setMetricKey] = useState<HistoryMetricKey>('receita_rs')
  const metric = HISTORY_METRICS.find((candidate) => candidate.key === metricKey) ?? HISTORY_METRICS[0]
  const points = history?.pontos ?? []
  return (
    <Sheet open={neighborhood !== null} onOpenChange={(isOpen) => (isOpen ? undefined : onClose())}>
      <SheetContent side="right" className="overflow-y-auto sm:max-w-xl">
        <div className="flex flex-col gap-6">
          <SheetHeader>
            <SheetTitle>{neighborhood?.bairro ?? 'Bairro'}</SheetTitle>
            <SheetDescription>
              {neighborhood?.municipio ?? ''} · últimos 24 meses até o fim do período de comparação.
            </SheetDescription>
          </SheetHeader>
          <Tabs value={metricKey} onValueChange={(next) => setMetricKey(next as HistoryMetricKey)}>
            <TabsList>
              {HISTORY_METRICS.map((option) => (
                <TabsTrigger key={option.key} value={option.key}>{option.tabLabel}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <AsyncState
            isLoading={isLoading}
            isError={isError}
            isEmpty={history !== undefined && points.length === 0}
            errorTitle="Não foi possível carregar o histórico"
            errorDescription={getRevenueErrorMessage(error)}
            emptyTitle="Sem histórico para este bairro"
            emptyIcon={<History className="size-10" />}
          >
            {points.length > 0 ? <MonthlyBarChart points={points} metric={metric} /> : null}
          </AsyncState>
        </div>
      </SheetContent>
    </Sheet>
  )
}
