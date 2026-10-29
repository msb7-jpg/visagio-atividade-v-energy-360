import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip } from '@/components/ui/tooltip-card'
import { PrioritizedQueueRow } from '@/features/loss_management/components/PrioritizedQueueRow'
import { QueuePagination } from '@/features/loss_management/components/QueuePagination'
import type { useQueueSelection } from '@/features/loss_management/hooks/useQueueSelection'
import type { SuspiciousUnit } from '@/features/loss_management/types/lossTypes'
import { formatInteger } from '@/features/loss_management/utils/lossFormatters'

type HeaderCheckState = boolean | 'indeterminate'

function headerCheckState(selectableCount: number, selectedCount: number): HeaderCheckState {
  if (selectableCount > 0 && selectedCount === selectableCount) return true
  return selectedCount > 0 ? 'indeterminate' : false
}

const PAGE_SIZE = 25
const SCORE_EXPLANATION =
  'Score de 0 a 100 = chance de irregularidade × energia recuperável, relativo à UC mais promissora da fila (100).'

const QUEDA_EXPLANATION =
  'Média dos 3 últimos meses contra a média dos 12 anteriores (menos, se a UC é recente). O gráfico do detalhe mostra mês a mês.'
const COLUMN_HELP: Record<string, string> = { Score: SCORE_EXPLANATION, Queda: QUEDA_EXPLANATION }

const COLUMNS = [
  '#',
  'UC',
  'Bairro / município',
  'Classe',
  'Score',
  'Queda',
  'Chance de acerto',
  'kWh/mês',
  'R$/ano',
  'Situação'
] as const

interface PrioritizedQueueTableProps {
  units: SuspiciousUnit[]
  /** UCs que passam nos filtros, antes do corte da fila; sem ele, o texto não cita o total da fila. */
  total?: number
  /** Nome acessível da tabela; as duas faixas da fila usam nomes diferentes. */
  label?: string
  selection: ReturnType<typeof useQueueSelection>
  /** Abre o painel de detalhe da UC (clique ou Enter na linha). */
  onOpenDetail: (idUc: string) => void
}

/**
 * Fila priorizada com seleção em massa: a ordem é a do backend (kWh esperado, da mais promissora para a menos).
 *
 * @param props - UCs visíveis, total da fila (opcional), nome da tabela, controle de seleção e abertura do detalhe.
 * @returns Tabela com marcação por linha e "marcar as UCs livres da página" no cabeçalho.
 */
export function PrioritizedQueueTable({
  units,
  total,
  label = 'Fila priorizada de UCs suspeitas',
  selection,
  onOpenDetail
}: PrioritizedQueueTableProps) {
  const [requestedPage, setRequestedPage] = useState(0)
  const pageCount = Math.max(1, Math.ceil(units.length / PAGE_SIZE))
  const page = Math.min(requestedPage, pageCount - 1)
  const firstRank = page * PAGE_SIZE
  const pageUnits = units.slice(firstRank, firstRank + PAGE_SIZE)
  const pageSelectableIds = pageUnits.filter(selection.isSelectable).map((unit) => unit.id_uc)
  const pageSelectedCount = pageSelectableIds.filter(selection.isSelected).length

  return (
    <div className="flex flex-col gap-2">
      <p className="text-muted-foreground text-xs">
        Mostrando {firstRank + 1}–{firstRank + pageUnits.length} de {formatInteger(units.length)} UCs carregadas
        {total === undefined ? '' : ` (${formatInteger(total)} na fila)`} · clique na linha da UC para ver por que
        ela está na fila
      </p>
      <Table aria-label={label}>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Checkbox
                aria-label="Selecionar as UCs livres da página"
                checked={headerCheckState(pageSelectableIds.length, pageSelectedCount)}
                disabled={pageSelectableIds.length === 0}
                onCheckedChange={() => selection.toggleMany(pageSelectableIds)}
              />
            </TableHead>
            {COLUMNS.map((column) => (
              <TableHead key={column}>
                {COLUMN_HELP[column] ? (
                  <Tooltip content={COLUMN_HELP[column]}>
                    <Button type="button" variant="link" size="sm">{column}</Button>
                  </Tooltip>
                ) : column}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageUnits.map((unit, rankIndex) => (
            <PrioritizedQueueRow
              key={unit.id_uc}
              unit={unit}
              rank={firstRank + rankIndex + 1}
              isSelected={selection.isSelected(unit.id_uc)}
              isSelectable={selection.isSelectable(unit)}
              onToggle={selection.toggle}
              onOpen={onOpenDetail}
            />
          ))}
        </TableBody>
      </Table>
      {pageCount > 1 ? <QueuePagination page={page} pageCount={pageCount} onPageChange={setRequestedPage} /> : null}
    </div>
  )
}
