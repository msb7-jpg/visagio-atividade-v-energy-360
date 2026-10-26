import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip-card'
import { Table, TableBody, TableCell, TableColumns, TableRow } from '@/components/ui/table'
import { QualityStatusBadge } from '@/features/grid_quality/components/QualityStatusBadge'
import { formatDecimal } from '@/features/grid_quality/utils/qualityFormatters'
import type { FeederRanking } from '@/features/grid_quality/types/qualityTypes'

const COLUMNS = ['Alimentador', 'DEC acumulado (h)', 'Limite anual DEC (h)', 'Excesso DEC (h)', 'FEC acumulado (vezes)', 'Limite anual FEC', 'Status'] as const

const APPROXIMATE_LIMIT_HINT =
  'Limite aproximado: mediana dos conjuntos mapeados da RMR, usada onde não há conjunto próprio (ADR-003).'

function DecLimitCell({ feeder }: { feeder: FeederRanking }) {
  return (
    <span className="flex items-center gap-2">
      {formatDecimal(feeder.dec_limite_horas)}
      {feeder.criterio_limite === 'MEDIANA_RMR' ? (
        <Tooltip content={APPROXIMATE_LIMIT_HINT}>
          <Badge variant="outline">Limite aproximado</Badge>
        </Tooltip>
      ) : null}
    </span>
  )
}

interface FeederRankingTableProps {
  feeders: FeederRanking[]
  onSelect: (feederId: string) => void
}

/**
 * Ranking de alimentadores por excesso do DEC acumulado no ano sobre o limite anual de referência.
 *
 * @param props - Alimentadores já ordenados pela API e callback de seleção.
 * @returns Tabela em que o código do alimentador abre a série histórica.
 */
export function FeederRankingTable({ feeders, onSelect }: FeederRankingTableProps) {
  // shortcut: sem paginação, a base tem ~100 alimentadores; paginar se passar de algumas centenas.
  return (
    <Table>
      <TableColumns columns={COLUMNS} />
      <TableBody>
        {feeders.map((feeder) => (
          <TableRow key={feeder.id_alimentador}>
            <TableCell>
              <Button variant="ghost" size="sm" onClick={() => onSelect(feeder.id_alimentador)}>
                {feeder.id_alimentador}
              </Button>
            </TableCell>
            <TableCell>{formatDecimal(feeder.dec_acumulado_ano_horas)}</TableCell>
            <TableCell><DecLimitCell feeder={feeder} /></TableCell>
            <TableCell>{formatDecimal(feeder.delta_dec_horas)}</TableCell>
            <TableCell>{formatDecimal(feeder.fec_acumulado_ano_vezes)}</TableCell>
            <TableCell>{formatDecimal(feeder.fec_limite_vezes)}</TableCell>
            <TableCell><QualityStatusBadge status={feeder.status} /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
