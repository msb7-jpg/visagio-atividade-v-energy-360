import { Button } from '@/components/ui/button'
import { useCanWriteLosses } from '@/features/loss_management/hooks/useCanWriteLosses'
import type { SuspiciousUnit } from '@/features/loss_management/types/lossTypes'
import { ordersLabel } from '@/features/loss_management/utils/lossFormatters'

export const TOP_SELECTION_COUNT = 10

interface QueueActionsBarProps {
  selectedUnits: SuspiciousUnit[]
  onSelectTop: () => void
  onGenerate: () => void
}

/**
 * Ações da fila: selecionar o topo e gerar as ordens das UCs marcadas. O resumo da seleção fica na `SelectionStrip`
 * e a exportação na aba Ordens.
 *
 * @param props - UCs marcadas e os callbacks.
 * @returns Linha com os botões; "Gerar" fica desligado sem UC marcada e não aparece para quem só consulta.
 */
export function QueueActionsBar({ selectedUnits, onSelectTop, onGenerate }: QueueActionsBarProps) {
  const canWrite = useCanWriteLosses()
  const selectedCount = selectedUnits.length

  return (
    <div className="ml-auto flex flex-wrap items-center gap-3">
      <Button type="button" variant="outline" size="sm" aria-label={`Selecionar top ${TOP_SELECTION_COUNT} prioritárias`} onClick={onSelectTop}>
        Top {TOP_SELECTION_COUNT}
      </Button>
      {canWrite ? (
        <Button type="button" onClick={onGenerate} disabled={selectedCount === 0}>
          Gerar {selectedCount} {ordersLabel(selectedCount)}
        </Button>
      ) : null}
    </div>
  )
}
