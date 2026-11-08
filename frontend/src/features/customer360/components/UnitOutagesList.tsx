import { Table, TableBody, TableCell, TableColumns, TableRow } from '@/components/ui/table'
import { ShowMoreButton } from '@/features/customer360/components/ShowMoreButton'
import { useExpandableList } from '@/features/customer360/hooks/useExpandableList'
import type { UnitOutage, UnitOutageSummary } from '@/features/customer360/types/customer360Types'
import { formatCount, formatDateTime, formatHours } from '@/features/customer360/utils/customer360Formatters'
import { formatGoldCode } from '@/features/customer360/utils/gridEventLabels'

const COLUMNS = ['Início', 'Duração', 'Tipo', 'Causa'] as const
const VISIBLE_OUTAGES = 5

function describeUnitOutages(outages: UnitOutage[], summary: UnitOutageSummary): string {
  const count = formatCount(summary.total_interrupcoes, 'interrupção registrada', 'interrupções registradas')
  const sentences = [`Esta unidade teve ${count}, somando ${formatHours(summary.total_horas)} sem energia.`]
  const longest = summary.mais_longa
  if (longest) {
    sentences.push(
      `A mais longa começou em ${formatDateTime(longest.inicio_interrupcao)} e durou ${formatHours(longest.duracao_horas)} (${formatGoldCode(longest.causa).toLowerCase()}).`
    )
  }
  if (outages.length < summary.total_interrupcoes) {
    sentences.push(`A lista abaixo mostra as ${outages.length} mais recentes.`)
  }
  return sentences.join(' ')
}

interface UnitOutagesListProps {
  outages: UnitOutage[]
  summary: UnitOutageSummary
}

/**
 * Interrupções que atingiram a própria UC, uma a uma, para o atendente confirmar se o cliente ficou sem luz.
 *
 * @param props - Interrupções listadas por `/events` (da mais recente para a mais antiga) e os totais de todas elas.
 * @returns Resumo com total de horas e a interrupção mais longa, e a tabela de interrupções.
 */
export function UnitOutagesList({ outages, summary }: UnitOutagesListProps) {
  const { visible, hiddenCount, expanded, toggle } = useExpandableList(outages, VISIBLE_OUTAGES)
  if (outages.length === 0) {
    return <p className="text-muted-foreground text-sm">Nenhuma interrupção registrada nesta unidade.</p>
  }
  return (
    <div className="flex flex-col gap-3">
      <p className="text-muted-foreground text-sm">{describeUnitOutages(outages, summary)}</p>
      <Table aria-label="Interrupções na unidade consumidora">
        <TableColumns columns={COLUMNS} />
        <TableBody>
          {visible.map((outage) => (
            <TableRow key={outage.id_ocorrencia}>
              <TableCell>{formatDateTime(outage.inicio_interrupcao)}</TableCell>
              <TableCell>{formatHours(outage.duracao_horas)}</TableCell>
              <TableCell>{formatGoldCode(outage.tipo_ocorrencia)}</TableCell>
              <TableCell>{formatGoldCode(outage.causa)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <ShowMoreButton hiddenCount={hiddenCount} expanded={expanded} onToggle={toggle} />
    </div>
  )
}
