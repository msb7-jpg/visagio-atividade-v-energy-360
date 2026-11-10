import { Zap } from 'lucide-react'
import { AsyncState } from '@/components/feedback/AsyncState'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { FeederCustomersList } from '@/features/grid_quality/components/FeederCustomersList'
import { FeederSheetBody } from '@/features/grid_quality/components/FeederSheetBody'
import { QualityStatusBadge } from '@/features/grid_quality/components/QualityStatusBadge'
import { FeederSheetSection } from '@/features/grid_quality/components/FeederSheetSection'
import type { AffectedCustomer, FeederHistory, FeederRanking } from '@/features/grid_quality/types/qualityTypes'
import { describeFeeder } from '@/features/grid_quality/utils/feederSummary'

interface FeederHistorySheetProps {
  feederId: string | null
  /** Linha do ranking do alimentador aberto: situação, acumulados e limites do ano. */
  feeder: FeederRanking | undefined
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
 * Painel lateral do alimentador: situação no ano contra o limite, DEC ano a ano, horas por mês e os clientes
 * mais afetados, no mesmo padrão do painel da UC na Fila de Inspeção.
 *
 * @param props - Alimentador aberto, linha do ranking, estado das consultas e fechamento.
 * @returns Sheet com cabeçalho fixo e corpo com rolagem própria.
 */
export function FeederHistorySheet({
  feederId,
  feeder,
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
  const customersBlock = (
    <AsyncState
      isLoading={isCustomersLoading}
      isError={isCustomersError}
      isEmpty={affectedCustomers.length === 0}
      errorTitle="Não foi possível carregar os clientes"
      onRetry={onRetryCustomers}
      emptyTitle="Nenhum cliente com interrupção neste alimentador"
    >
      <FeederCustomersList customers={affectedCustomers} />
    </AsyncState>
  )
  return (
    <Sheet open={feederId !== null} onOpenChange={(isOpen) => (isOpen ? undefined : onClose())}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-xl">
        <div className="border-border -mx-6 border-b px-6 pb-5">
          <SheetHeader>
            <div className="flex flex-wrap items-center gap-2.5 pr-8">
              <SheetTitle>Alimentador {feederId}</SheetTitle>
              {feeder ? <QualityStatusBadge status={feeder.status} /> : null}
            </div>
            <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
              <Zap className="size-4 shrink-0" aria-hidden="true" />
              <SheetDescription>{describeFeeder(feeder ?? history?.pontos.at(-1))}</SheetDescription>
            </div>
          </SheetHeader>
        </div>
        <div className="-mx-6 min-h-0 flex-1 overflow-y-auto px-6 py-2">
          <AsyncState
            isLoading={isLoading}
            isError={isError}
            isEmpty={points.length === 0}
            errorTitle="Não foi possível carregar o histórico"
            onRetry={onRetryHistory}
            emptyTitle="Sem histórico para este alimentador"
          >
            {points.length > 0 ? <FeederSheetBody points={points} feeder={feeder} /> : null}
          </AsyncState>
          <div className="border-border mt-5 border-t">
            <FeederSheetSection title="Clientes mais afetados · 12 meses">{customersBlock}</FeederSheetSection>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
