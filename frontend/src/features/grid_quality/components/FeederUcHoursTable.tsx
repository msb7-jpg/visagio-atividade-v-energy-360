import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableColumns, TableRow } from '@/components/ui/table'
import { formatInteger, formatPercent } from '@/features/grid_quality/utils/continuityFormatters'
import { formatDecimal } from '@/features/grid_quality/utils/qualityFormatters'
import type { FeederUcHours } from '@/features/grid_quality/types/continuityTypes'

const COLUMNS = ['Alimentador', 'Município', 'UCs', 'DEC B (h)', 'FEC B', 'Ocorrências', 'UC-horas', '% da rede', 'DEC A (h)', 'B contra A'] as const

/** Quantas vezes o DEC de B é maior que o de A; sem base em A, mostra travessão. */
function TimesBadge({ current, previous }: { current: number; previous: number }) {
  if (previous === 0) {
    return <span className="text-muted-foreground">—</span>
  }
  const times = current / previous
  return <Badge variant={times > 1 ? 'destructive' : 'secondary'}>×{formatDecimal(times)}</Badge>
}

/**
 * Alimentadores do período B ordenados por UC-horas, com DEC, FEC e comparação contra o período A.
 *
 * @param props - Alimentadores já ordenados por UC-horas.
 * @returns Tabela com uma linha por alimentador.
 */
export function FeederUcHoursTable({ feeders }: { feeders: FeederUcHours[] }) {
  return (
    <Table>
      <TableColumns columns={COLUMNS} />
      <TableBody>
        {feeders.map((feeder) => (
          <TableRow key={feeder.id_alimentador}>
            <TableCell><strong>{feeder.id_alimentador}</strong></TableCell>
            <TableCell>
              <span className="flex items-center gap-2">
                {feeder.municipality}
                {feeder.smallSample ? <Badge variant="warning">amostra pequena</Badge> : null}
              </span>
            </TableCell>
            <TableCell>{formatInteger(feeder.ucsServed)}</TableCell>
            <TableCell>{formatDecimal(feeder.decHours)}</TableCell>
            <TableCell>{formatDecimal(feeder.fecTimes)}</TableCell>
            <TableCell>{formatInteger(feeder.interruptions)}</TableCell>
            <TableCell><strong>{formatInteger(feeder.ucHours)}</strong></TableCell>
            <TableCell>{formatPercent(feeder.networkSharePercent)}</TableCell>
            <TableCell>{formatDecimal(feeder.decPreviousHours)}</TableCell>
            <TableCell><TimesBadge current={feeder.decHours} previous={feeder.decPreviousHours} /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
