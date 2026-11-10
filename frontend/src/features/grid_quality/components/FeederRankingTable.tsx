import { ShareBar } from '@/components/data/ShareBar'
import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip-card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { QualityStatusBadge } from '@/features/grid_quality/components/QualityStatusBadge'
import { formatDecimal } from '@/features/grid_quality/utils/qualityFormatters'
import type { FeederRanking, QualityStatus } from '@/features/grid_quality/types/qualityTypes'

interface ColumnDef {
  key: string
  label: string
  tooltip: string
}

const COLUMNS: readonly ColumnDef[] = [
  {
    key: 'alimentador',
    label: 'Alimentador',
    tooltip: 'Circuito elétrico de média tensão que atende um conjunto de unidades consumidoras (UCs).'
  },
  {
    key: 'dec',
    label: 'DEC no ano (horas)',
    tooltip: 'Duração Equivalente de Interrupção acumulada no ano civil (em horas). Média de horas sem luz por UC atendida (PRODIST Módulo 8 da ANEEL).'
  },
  {
    key: 'dec_limite',
    label: 'Limite DEC (horas)',
    tooltip: 'Meta máxima anual de horas de interrupção fixada pela ANEEL para o conjunto elétrico do circuito.'
  },
  {
    key: 'dec_excesso',
    label: 'Excesso DEC (horas)',
    tooltip: 'Diferença entre o DEC acumulado no ano e o limite da ANEEL. Valores positivos indicam violação da meta regulatória.'
  },
  {
    key: 'fec',
    label: 'FEC no ano (vezes)',
    tooltip: 'Frequência Equivalente de Interrupção acumulada no ano civil (número médio de quedas de energia por UC atendida, PRODIST Módulo 8 da ANEEL).'
  },
  {
    key: 'fec_limite',
    label: 'Limite FEC (vezes)',
    tooltip: 'Meta máxima anual de interrupções toleradas pela ANEEL para o conjunto elétrico.'
  },
  {
    key: 'status',
    label: 'Situação',
    tooltip: 'Classificação perante as metas da ANEEL: Conforme (<85% do limite), Alerta (85% a 100%) ou Acima do limite (>100%).'
  }
]

const APPROXIMATE_LIMIT_HINT =
  'Limite aproximado: mediana dos conjuntos mapeados da RMR, usada onde não há conjunto próprio (ADR-003).'

const STATUS_TONE: Record<QualityStatus, string> = { violacao: 'bg-destructive', alerta: 'bg-warning', conforme: 'bg-success' }

function DecCell({ feeder }: { feeder: FeederRanking }) {
  const usage = feeder.dec_limite_horas ? (feeder.dec_acumulado_ano_horas / feeder.dec_limite_horas) * 100 : 0
  return (
    <div className="flex w-28 flex-col gap-1">
      <span className="font-medium tabular-nums">{formatDecimal(feeder.dec_acumulado_ano_horas)}</span>
      <ShareBar percent={usage} tone={STATUS_TONE[feeder.status]} />
    </div>
  )
}

function DecLimitCell({ feeder }: { feeder: FeederRanking }) {
  return (
    <span className="flex items-center gap-1">
      <span>{formatDecimal(feeder.dec_limite_horas)}</span>
      {feeder.criterio_limite === 'MEDIANA_RMR' ? (
        <Tooltip content={APPROXIMATE_LIMIT_HINT}>
          <span className="text-muted-foreground cursor-help text-xs" aria-hidden="false">
            <span aria-hidden="true">≈</span>
            <span className="sr-only">Limite aproximado</span>
          </span>
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
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {COLUMNS.map((column) => (
            <TableHead key={column.key}>
              <Tooltip content={column.tooltip}>
                <span className="inline-flex cursor-help items-center gap-1 border-b border-dotted border-muted-foreground/50 pb-0.5">
                  <span>{column.label}</span>
                </span>
              </Tooltip>
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {feeders.map((feeder) => (
          <TableRow key={feeder.id_alimentador}>
            <TableCell>
              <Button variant="inline" size="inline" onClick={() => onSelect(feeder.id_alimentador)}>
                {feeder.id_alimentador}
              </Button>
            </TableCell>
            <TableCell><DecCell feeder={feeder} /></TableCell>
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
