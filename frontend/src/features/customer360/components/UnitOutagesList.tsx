import { ZapOff } from 'lucide-react'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Table, TableBody, TableCell, TableColumns, TableRow } from '@/components/ui/table'
import type { UnitOutage } from '@/features/customer360/types/customer360Types'
import { formatCount, formatDateTime, formatHours } from '@/features/customer360/utils/customer360Formatters'
import { formatGoldCode } from '@/features/customer360/utils/gridEventLabels'

const COLUMNS = ['Início', 'Duração', 'Tipo', 'Causa'] as const

function outageHours(outage: UnitOutage): number {
  return outage.duracao_horas ?? 0
}

function describeUnitOutages(outages: UnitOutage[]): string {
  const totalHours = outages.reduce((accumulated, outage) => accumulated + outageHours(outage), 0)
  const longest = outages.reduce((worst, outage) => (outageHours(outage) > outageHours(worst) ? outage : worst), outages[0])
  const total = `Esta unidade teve ${formatCount(outages.length, 'interrupção registrada', 'interrupções registradas')}, somando ${formatHours(totalHours)} sem energia.`
  const longestText = `A mais longa começou em ${formatDateTime(longest.inicio_interrupcao)} e durou ${formatHours(longest.duracao_horas)} (${formatGoldCode(longest.causa).toLowerCase()}).`
  return `${total} ${longestText}`
}

interface UnitOutagesListProps {
  outages: UnitOutage[]
}

/**
 * Interrupções que atingiram a própria UC, uma a uma, para o atendente confirmar se o cliente ficou sem luz.
 *
 * @param props - Interrupções da UC retornadas por `/events`, da mais recente para a mais antiga.
 * @returns Resumo com total de horas e a interrupção mais longa, e a tabela de interrupções.
 */
export function UnitOutagesList({ outages }: UnitOutagesListProps) {
  if (outages.length === 0) {
    return (
      <EmptyState
        title="Nenhuma interrupção nesta unidade"
        description="Não há registro de falta de energia que tenha atingido esta unidade consumidora."
        icon={<ZapOff className="size-10" />}
      />
    )
  }
  return (
    <div className="flex flex-col gap-3">
      <p className="text-muted-foreground text-sm">{describeUnitOutages(outages)}</p>
      <Table aria-label="Interrupções na unidade consumidora">
        <TableColumns columns={COLUMNS} />
        <TableBody>
          {outages.map((outage) => (
            <TableRow key={outage.id_ocorrencia}>
              <TableCell>{formatDateTime(outage.inicio_interrupcao)}</TableCell>
              <TableCell>{formatHours(outage.duracao_horas)}</TableCell>
              <TableCell>{formatGoldCode(outage.tipo_ocorrencia)}</TableCell>
              <TableCell>{formatGoldCode(outage.causa)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
