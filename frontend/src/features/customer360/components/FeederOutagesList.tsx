import { ZapOff } from 'lucide-react'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { FeederQualityMonth } from '@/features/customer360/types/customer360Types'
import { formatCompetencia, formatCount, formatHours } from '@/features/customer360/utils/customer360Formatters'
import { analyzeOutages, type OutageOverview } from '@/features/customer360/utils/outageAnalysis'

function describeOutages(feeder: string | null, overview: OutageOverview): string {
  const feederName = feeder ?? 'da região'
  const average = `Em média, cada cliente do alimentador ${feederName} ficou ${formatHours(overview.averageHours)} sem energia por mês.`
  if (overview.aboveNormalMonths.length === 0 || !overview.worstMonth) {
    return `${average} Nenhum mês ficou acima do normal.`
  }
  const worst = `${formatCompetencia(overview.worstMonth.competencia)} (${formatHours(overview.worstMonth.dec_apurado_horas)})`
  return `${average} ${formatCount(overview.aboveNormalMonths.length, 'mês ficou', 'meses ficaram')} acima do normal; o pior foi ${worst}.`
}

interface FeederOutagesListProps {
  feeder: string | null
  months: FeederQualityMonth[]
}

/**
 * Falta de luz na região da UC: horas e interrupções por cliente do alimentador, mês a mês, com destaque aos meses acima do normal.
 *
 * @param props - Alimentador da UC e continuidade mensal retornada por `/events`.
 * @returns Resumo da região e tabela mensal de interrupções.
 */
export function FeederOutagesList({ feeder, months }: FeederOutagesListProps) {
  if (months.length === 0) {
    return (
      <EmptyState
        title="Sem dados de interrupção"
        description="Não há registros de continuidade para o alimentador desta unidade."
        icon={<ZapOff className="size-10" />}
      />
    )
  }
  const overview = analyzeOutages(months)
  return (
    <div className="flex flex-col gap-3">
      <p className="text-muted-foreground text-sm">{describeOutages(feeder, overview)}</p>
      <Table aria-label="Interrupções no alimentador">
        <TableHeader>
          <TableRow>
            <TableHead>Mês</TableHead>
            <TableHead>Horas sem energia</TableHead>
            <TableHead>Interrupções</TableHead>
            <TableHead>Situação</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {months.map((month) => (
            <TableRow key={month.competencia}>
              <TableCell>{formatCompetencia(month.competencia)}</TableCell>
              <TableCell>{formatHours(month.dec_apurado_horas)}</TableCell>
              <TableCell>{formatCount(month.fec_apurado_vezes ?? 0, 'vez', 'vezes')}</TableCell>
              <TableCell>
                {overview.aboveNormalMonths.includes(month.competencia)
                  ? <Badge variant="destructive">Acima do normal</Badge>
                  : <Badge variant="outline">Normal</Badge>}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <span className="text-muted-foreground text-xs">
        Valores médios por cliente do alimentador (DEC e FEC), comparados aos outros meses do mesmo circuito.
      </span>
    </div>
  )
}
