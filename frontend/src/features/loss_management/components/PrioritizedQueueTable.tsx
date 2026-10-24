import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PrioritizedQueueRow } from '@/features/loss_management/components/PrioritizedQueueRow'
import type { useQueueSelection } from '@/features/loss_management/hooks/useQueueSelection'
import type { SuspiciousUnit } from '@/features/loss_management/types/lossTypes'
import { formatInteger } from '@/features/loss_management/utils/lossFormatters'

type HeaderCheckState = boolean | 'indeterminate'

function headerCheckState(isAllSelected: boolean, selectedCount: number): HeaderCheckState {
  if (isAllSelected) return true
  return selectedCount > 0 ? 'indeterminate' : false
}

const COLUMNS = ['#', 'UC', 'Bairro / município', 'Classe', 'Score', 'Motivos', 'kWh/mês', 'R$/ano', 'Situação'] as const

interface PrioritizedQueueTableProps {
  units: SuspiciousUnit[]
  /** UCs que passam nos filtros, antes do corte da fila. */
  total: number
  selection: ReturnType<typeof useQueueSelection>
}

/**
 * Fila priorizada com seleção em massa: a ordem é a do backend (kWh esperado, da mais promissora para a menos).
 *
 * @param props - UCs visíveis, total da fila e controle de seleção.
 * @returns Tabela com marcação por linha e "marcar todas as UCs livres" no cabeçalho.
 */
export function PrioritizedQueueTable({ units, total, selection }: PrioritizedQueueTableProps) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-muted-foreground text-xs">
        Mostrando {units.length} de {formatInteger(total)} UCs (top {units.length} por score) · clique no número da UC para
        ver por que ela está na fila
      </p>
      <Table aria-label="Fila priorizada de UCs suspeitas">
        <TableHeader>
          <TableRow>
            <TableHead>
              <Checkbox
                aria-label="Selecionar todas as UCs livres"
                checked={headerCheckState(selection.allSelected, selection.selectedIds.length)}
                disabled={!units.some(selection.isSelectable)}
                onCheckedChange={selection.toggleAll}
              />
            </TableHead>
            {COLUMNS.map((column) => <TableHead key={column}>{column}</TableHead>)}
          </TableRow>
        </TableHeader>
        <TableBody>
          {units.map((unit, rankIndex) => (
            <PrioritizedQueueRow
              key={unit.id_uc}
              unit={unit}
              rank={rankIndex + 1}
              isSelected={selection.isSelected(unit.id_uc)}
              isSelectable={selection.isSelectable(unit)}
              onToggle={selection.toggle}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
