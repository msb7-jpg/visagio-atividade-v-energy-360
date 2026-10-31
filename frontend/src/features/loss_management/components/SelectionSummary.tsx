import { Badge } from '@/components/ui/badge'
import type { SuspiciousUnit } from '@/features/loss_management/types/lossTypes'
import { formatInteger, formatPercent } from '@/features/loss_management/utils/lossFormatters'
import { PRIORITY_MIN_HIT_PROBABILITY } from '@/features/loss_management/utils/queueBands'
import { selectionOutlook } from '@/features/loss_management/utils/queueOutlook'

interface SelectionSummaryProps {
  units: SuspiciousUnit[]
}

/**
 * Resumo de uma linha da seleção, para a barra da fila: quantas UCs e quantas devem achar irregularidade.
 * O texto completo da expectativa (inclui as que voltam sem achado) fica no diálogo de gerar ordens.
 *
 * @param props - UCs marcadas para gerar ordem.
 * @returns Resumo com o selo de baixa chance quando há; nada sem UC marcada.
 */
export function SelectionSummary({ units }: SelectionSummaryProps) {
  const { selectedCount, expectedHits, lowChanceCount } = selectionOutlook(units)
  if (selectedCount === 0) return null

  return (
    <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
      <span>
        {formatInteger(selectedCount)} {selectedCount === 1 ? 'selecionada' : 'selecionadas'} · cerca de{' '}
        {formatInteger(expectedHits)} {expectedHits === 1 ? 'deve achar' : 'devem achar'} irregularidade
      </span>
      {lowChanceCount > 0 ? (
        <Badge variant="warning">
          {formatInteger(lowChanceCount)} com chance abaixo de {formatPercent(PRIORITY_MIN_HIT_PROBABILITY)}
        </Badge>
      ) : null}
    </div>
  )
}
