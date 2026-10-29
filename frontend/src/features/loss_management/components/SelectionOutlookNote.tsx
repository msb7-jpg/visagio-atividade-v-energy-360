import type { SuspiciousUnit } from '@/features/loss_management/types/lossTypes'
import { formatInteger, formatPercent } from '@/features/loss_management/utils/lossFormatters'
import { PRIORITY_MIN_HIT_PROBABILITY } from '@/features/loss_management/utils/queueBands'
import { selectionOutlook } from '@/features/loss_management/utils/queueOutlook'

interface SelectionOutlookNoteProps {
  units: SuspiciousUnit[]
}

/**
 * Quantas inspeções da seleção devem achar irregularidade e quantas devem voltar sem achado.
 *
 * @param props - UCs marcadas para gerar ordem.
 * @returns Texto da expectativa pela chance de acerto histórica de cada UC e, havendo, o aviso de baixa chance.
 */
export function SelectionOutlookNote({ units }: SelectionOutlookNoteProps) {
  const { selectedCount, expectedHits, expectedMisses, lowChanceCount } = selectionOutlook(units)
  if (selectedCount === 0) return null

  return (
    <div className="text-muted-foreground flex flex-col gap-1 text-sm">
      <p>
        Pelo histórico, cerca de {formatInteger(expectedHits)} de {formatInteger(selectedCount)}{' '}
        {selectedCount === 1 ? 'inspeção deve' : 'inspeções devem'} achar irregularidade;{' '}
        {formatInteger(expectedMisses)} {expectedMisses === 1 ? 'deve' : 'devem'} voltar sem achado.
      </p>
      {lowChanceCount > 0 ? (
        <p className="text-warning">
          {formatInteger(lowChanceCount)} {lowChanceCount === 1 ? 'das selecionadas tem' : 'das selecionadas têm'} chance de
          acerto abaixo de {formatPercent(PRIORITY_MIN_HIT_PROBABILITY)}.
        </p>
      ) : null}
    </div>
  )
}
