import { AsyncState } from '@/components/feedback/AsyncState'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { FeederCustomersTable } from '@/features/grid_quality/components/FeederCustomersTable'
import { FeederTimeSeriesChart } from '@/features/grid_quality/components/FeederTimeSeriesChart'
import type { AffectedCustomer, FeederHistory } from '@/features/grid_quality/types/qualityTypes'

interface FeederHistorySheetProps {
  feederId: string | null
  history: FeederHistory | undefined
  isLoading: boolean
  isError: boolean
  customers: AffectedCustomer[] | undefined
  isCustomersLoading: boolean
  isCustomersError: boolean
  onRetryHistory: () => void
  onRetryCustomers: () => void
  onClose: () => void
}

/**
 * Gaveta lateral com a série histórica de 48 meses e os clientes mais afetados do alimentador selecionado.
 *
 * @param props - Alimentador aberto, estado das consultas do histórico e dos clientes e callback de fechamento.
 * @returns Gaveta com skeleton, erro, vazio, o gráfico e a tabela de clientes.
 */
export function FeederHistorySheet({
  feederId,
  history,
  isLoading,
  isError,
  customers,
  isCustomersLoading,
  isCustomersError,
  onRetryHistory,
  onRetryCustomers,
  onClose
}: FeederHistorySheetProps) {
  const points = history?.pontos ?? []
  const affectedCustomers = customers ?? []
  return (
    <Sheet open={feederId !== null} onOpenChange={(isOpen) => (isOpen ? undefined : onClose())}>
      <SheetContent side="right" className="overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Alimentador {feederId}</SheetTitle>
          <SheetDescription>DEC acumulado no ano contra o limite anual de referência; o valor do mês aparece ao passar o mouse.</SheetDescription>
        </SheetHeader>
        <AsyncState
          isLoading={isLoading}
          isError={isError}
          isEmpty={points.length === 0}
          errorTitle="Não foi possível carregar o histórico"
          onRetry={onRetryHistory}
          emptyTitle="Sem histórico para este alimentador"
        >
          <FeederTimeSeriesChart points={points} />
        </AsyncState>
        <h3 className="text-foreground text-sm font-bold">Clientes mais afetados (últimos 12 meses)</h3>
        <AsyncState
          isLoading={isCustomersLoading}
          isError={isCustomersError}
          isEmpty={affectedCustomers.length === 0}
          errorTitle="Não foi possível carregar os clientes"
          onRetry={onRetryCustomers}
          emptyTitle="Nenhum cliente com interrupção neste alimentador"
        >
          <FeederCustomersTable customers={affectedCustomers} />
        </AsyncState>
      </SheetContent>
    </Sheet>
  )
}
