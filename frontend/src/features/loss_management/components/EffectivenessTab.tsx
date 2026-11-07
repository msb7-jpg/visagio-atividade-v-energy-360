import { AsyncState } from '@/components/feedback/AsyncState'
import { Card } from '@/components/ui/card'
import { BacktestSeriesView } from '@/features/loss_management/components/BacktestSeriesView'
import { FieldResultsKpis } from '@/features/loss_management/components/FieldResultsKpis'
import { useEffectivenessController } from '@/features/loss_management/hooks/useEffectivenessController'

/**
 * Aba "Efetividade": resultados reais de campo e o backtest da seleção da fila em todos os cortes.
 *
 * @returns KPIs de campo e o backtest, com a comparação entre cortes e o detalhe de um deles.
 */
export function EffectivenessTab() {
  const { inspections, orders, series, results, selected, selectCutoff } = useEffectivenessController()

  return (
    <div className="flex flex-col gap-4">
      <section aria-label="Resultados reais de campo" className="flex flex-col gap-2">
        <h2 className="text-sm font-medium">Resultados reais de campo</h2>
        <AsyncState
          isLoading={inspections.isLoading}
          isError={inspections.isError}
          errorTitle="Não foi possível carregar os resultados de campo"
          errorDescription="As ordens de inspeção não puderam ser lidas. Tente novamente em instantes."
          onRetry={() => void inspections.refetch()}
        >
          <FieldResultsKpis orders={orders} />
        </AsyncState>
      </section>
      <Card className="flex flex-col gap-4 p-4">
        <h2 className="text-sm font-medium">Backtest da seleção</h2>
        <p className="text-muted-foreground text-sm">
          Em cada mês de corte, a fila é refeita só com os dados até aquele mês, e as primeiras UCs da seleção são
          medidas nas inspeções de campo dos 3 meses seguintes.
        </p>
        <AsyncState
          isLoading={series.isLoading}
          isError={series.isError}
          errorTitle="Não foi possível executar o backtest"
          errorDescription="Verifique se o histórico de inspeções está disponível."
          onRetry={() => void series.refetch()}
        >
          {series.data ? <BacktestSeriesView results={results} selected={selected} onSelectCutoff={selectCutoff} /> : null}
        </AsyncState>
      </Card>
    </div>
  )
}
