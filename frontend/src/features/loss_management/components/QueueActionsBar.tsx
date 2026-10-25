import { Button } from '@/components/ui/button'
import { ExportOrdersButton } from '@/features/loss_management/components/ExportOrdersButton'
import { ordersLabel } from '@/features/loss_management/utils/lossFormatters'

export const TOP_SELECTION_COUNT = 10

interface QueueActionsBarProps {
  selectedCount: number
  /** False quando não há ordem gerada ou em campo para exportar. */
  hasOrdersToExport: boolean
  onSelectTop: () => void
  onGenerate: () => void
}

/**
 * Ações da fila: exportar, selecionar o topo e gerar as ordens das UCs marcadas.
 *
 * @param props - Quantidade marcada, se há ordens a exportar e os callbacks.
 * @returns Barra de botões; "Gerar" fica desligado sem UC marcada.
 */
export function QueueActionsBar({ selectedCount, hasOrdersToExport, onSelectTop, onGenerate }: QueueActionsBarProps) {
  return (
    <div className="flex flex-wrap items-start gap-2">
      <ExportOrdersButton label="Exportar fila (CSV)" disabled={!hasOrdersToExport} />
      <Button type="button" variant="outline" onClick={onSelectTop}>
        Selecionar top {TOP_SELECTION_COUNT}
      </Button>
      <Button type="button" onClick={onGenerate} disabled={selectedCount === 0}>
        Gerar {selectedCount} {ordersLabel(selectedCount)}
      </Button>
    </div>
  )
}
