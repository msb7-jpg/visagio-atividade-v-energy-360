import { Button } from '@/components/ui/button'
import { useCanWriteLosses } from '@/features/loss_management/hooks/useCanWriteLosses'
import { ordersLabel } from '@/features/loss_management/utils/lossFormatters'

export const TOP_SELECTION_COUNT = 10

interface QueueActionsBarProps {
  selectedCount: number
  onSelectTop: () => void
  onGenerate: () => void
}

/**
 * Ações da fila: selecionar o topo e gerar as ordens das UCs marcadas. A exportação fica na aba Ordens.
 *
 * @param props - Quantidade marcada e os callbacks.
 * @returns Barra de botões; "Gerar" fica desligado sem UC marcada e não aparece para quem só consulta.
 */
export function QueueActionsBar({ selectedCount, onSelectTop, onGenerate }: QueueActionsBarProps) {
  const canWrite = useCanWriteLosses()

  return (
    <div className="flex flex-wrap items-start gap-2">
      <Button type="button" variant="outline" onClick={onSelectTop}>
        Selecionar top {TOP_SELECTION_COUNT} prioritárias
      </Button>
      {canWrite ? (
        <Button type="button" onClick={onGenerate} disabled={selectedCount === 0}>
          Gerar {selectedCount} {ordersLabel(selectedCount)}
        </Button>
      ) : null}
    </div>
  )
}
