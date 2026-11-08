import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCanWriteLosses } from '@/features/loss_management/hooks/useCanWriteLosses'
import { ordersLabel } from '@/features/loss_management/utils/lossFormatters'
import { MAX_SELECTION_COUNT, parsePositiveInt } from '@/features/loss_management/utils/queueCurve'

const TOP_COUNT_INPUT_ID = 'queue-top-count'
const TOP_COUNT_HINT_ID = 'queue-top-count-hint'

function markLabel(count: number | null): string {
  if (count === null) return 'Marcar as N primeiras'
  return count === 1 ? 'Marcar a primeira UC' : `Marcar as ${count} primeiras`
}

interface QueueActionsBarProps {
  selectedCount: number
  /** Texto do campo "quantas inspecionar"; o N só vale no navegador e não é gravado no servidor. */
  topCountText: string
  /** True enquanto as páginas da fila são carregadas para achar as N UCs livres. */
  isSelecting: boolean
  onTopCountTextChange: (text: string) => void
  onSelectTop: () => void
  onGenerate: () => void
}

/**
 * Ações da fila: escolher quantas UCs inspecionar, marcar as primeiras livres e gerar as ordens das marcadas. O
 * resumo da seleção fica na `SelectionStrip` e a exportação na aba Ordens.
 *
 * @param props - Quantidade marcada, o N digitado e os callbacks.
 * @returns Linha com o campo N e os botões; "Gerar" fica desligado sem UC marcada e não aparece para quem só consulta.
 */
export function QueueActionsBar({
  selectedCount,
  topCountText,
  isSelecting,
  onTopCountTextChange,
  onSelectTop,
  onGenerate
}: QueueActionsBarProps) {
  const canWrite = useCanWriteLosses()
  const topCount = parsePositiveInt(topCountText)
  const isOverLimit = topCount !== null && topCount > MAX_SELECTION_COUNT
  const markedCount = topCount === null ? null : Math.min(topCount, MAX_SELECTION_COUNT)

  return (
    <div className="ml-auto flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <Label htmlFor={TOP_COUNT_INPUT_ID}>Quantas UCs inspecionar</Label>
        <div className="w-24">
          <Input
            id={TOP_COUNT_INPUT_ID}
            inputMode="numeric"
            value={topCountText}
            aria-invalid={topCount === null}
            aria-describedby={isOverLimit ? TOP_COUNT_HINT_ID : undefined}
            onChange={(event) => onTopCountTextChange(event.target.value)}
          />
        </div>
        {isOverLimit ? (
          <p id={TOP_COUNT_HINT_ID} role="status" className="text-muted-foreground text-xs">
            Marca no máximo {MAX_SELECTION_COUNT} UCs por vez.
          </p>
        ) : null}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={markedCount === null || isSelecting}
        onClick={onSelectTop}
      >
        {isSelecting ? 'Marcando…' : markLabel(markedCount)}
      </Button>
      {canWrite ? (
        <Button type="button" onClick={onGenerate} disabled={selectedCount === 0}>
          Gerar {selectedCount} {ordersLabel(selectedCount)}
        </Button>
      ) : null}
    </div>
  )
}
