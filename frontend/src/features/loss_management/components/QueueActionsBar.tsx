import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCanWriteLosses } from '@/features/loss_management/hooks/useCanWriteLosses'
import { ordersLabel } from '@/features/loss_management/utils/lossFormatters'
import { parsePositiveInt } from '@/features/loss_management/utils/queueCurve'

const TOP_COUNT_INPUT_ID = 'queue-top-count'

interface QueueActionsBarProps {
  selectedCount: number
  /** Texto do campo "quantas inspecionar"; o N só vale no navegador e não é gravado no servidor. */
  topCountText: string
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
  onTopCountTextChange,
  onSelectTop,
  onGenerate
}: QueueActionsBarProps) {
  const canWrite = useCanWriteLosses()
  const topCount = parsePositiveInt(topCountText)

  return (
    <div className="ml-auto flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <Label htmlFor={TOP_COUNT_INPUT_ID}>Quantas UCs inspecionar</Label>
        <div className="w-24">
          <Input
            id={TOP_COUNT_INPUT_ID}
            inputMode="numeric"
            value={topCountText}
            onChange={(event) => onTopCountTextChange(event.target.value)}
          />
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={topCount === null}
        aria-label={`Selecionar as ${topCount ?? 'N'} primeiras UCs livres`}
        onClick={onSelectTop}
      >
        Marcar as {topCount ?? 'N'} primeiras
      </Button>
      {canWrite ? (
        <Button type="button" onClick={onGenerate} disabled={selectedCount === 0}>
          Gerar {selectedCount} {ordersLabel(selectedCount)}
        </Button>
      ) : null}
    </div>
  )
}
