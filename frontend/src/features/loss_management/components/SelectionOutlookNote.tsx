import type { SuspiciousUnit } from '@/features/loss_management/types/lossTypes'
import { formatInteger } from '@/features/loss_management/utils/lossFormatters'
import { selectionOutlook } from '@/features/loss_management/utils/queueOutlook'

interface SelectionOutlookNoteProps {
  units: SuspiciousUnit[]
}

/**
 * Quantas das UCs selecionadas estão na faixa prioritária.
 *
 * @param props - UCs marcadas para gerar ordem.
 * @returns A contagem de prioritárias e, havendo, o aviso das que ficaram fora da faixa prioritária.
 */
export function SelectionOutlookNote({ units }: SelectionOutlookNoteProps) {
  const { selectedCount, priorityCount, otherCount } = selectionOutlook(units)
  if (selectedCount === 0) return null

  return (
    <div className="text-muted-foreground flex flex-col gap-1 text-sm">
      <p>
        {formatInteger(priorityCount)} de {formatInteger(selectedCount)}{' '}
        {selectedCount === 1 ? 'selecionada é prioritária' : 'selecionadas são prioritárias'}.
      </p>
      {otherCount > 0 ? (
        <p className="text-warning">
          {formatInteger(otherCount)} {otherCount === 1 ? 'das selecionadas está' : 'das selecionadas estão'} fora da
          faixa prioritária.
        </p>
      ) : null}
    </div>
  )
}
