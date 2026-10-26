import { AsyncState } from '@/components/feedback/AsyncState'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { FeederTimeSeriesChart } from '@/features/grid_quality/components/FeederTimeSeriesChart'
import type { FeederHistory } from '@/features/grid_quality/types/qualityTypes'

interface FeederHistorySheetProps {
  feederId: string | null
  history: FeederHistory | undefined
  isLoading: boolean
  isError: boolean
  onClose: () => void
}

/**
 * Gaveta lateral com a série histórica de 48 meses do alimentador selecionado.
 *
 * @param props - Alimentador aberto, estado da consulta do histórico e callback de fechamento.
 * @returns Gaveta com skeleton, erro, vazio ou o gráfico.
 */
export function FeederHistorySheet({ feederId, history, isLoading, isError, onClose }: FeederHistorySheetProps) {
  const points = history?.pontos ?? []
  return (
    <Sheet open={feederId !== null} onOpenChange={(isOpen) => (isOpen ? undefined : onClose())}>
      <SheetContent side="right" className="sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Alimentador {feederId}</SheetTitle>
          <SheetDescription>DEC acumulado no ano contra o limite anual de referência (suposição pendente, B1); o valor do mês aparece ao passar o mouse.</SheetDescription>
        </SheetHeader>
        <AsyncState
          isLoading={isLoading}
          isError={isError}
          isEmpty={points.length === 0}
          errorTitle="Não foi possível carregar o histórico"
          emptyTitle="Sem histórico para este alimentador"
        >
          <FeederTimeSeriesChart points={points} />
        </AsyncState>
      </SheetContent>
    </Sheet>
  )
}
