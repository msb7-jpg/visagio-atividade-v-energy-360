import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { LossesSnapshot } from '@/features/executive_dashboard/types/executiveDashboardTypes'
import { formatMonth } from '@/features/executive_dashboard/utils/dashboardPeriods'
import { formatIndicatorValue, formatMonthlyKwh } from '@/features/executive_dashboard/utils/indicatorFormatters'

const countFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 })

function SnapshotFigure({ label, value, detail }: { label: string, value: string, detail?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <CardDescription>{label}</CardDescription>
      <div className="text-foreground font-mono tabular-nums text-2xl font-bold tracking-tight">{value}</div>
      {detail ? <CardDescription>{detail}</CardDescription> : null}
    </div>
  )
}

function snapshotNotes(snapshot: LossesSnapshot): string[] {
  const notes = [
    snapshot.competencia_fixada ? 'Competência fixada para a demonstração, e não a mais recente.' : null,
    snapshot.ucs_na_fila === 0 ? 'Nenhuma UC com queda suspeita nesta competência.' : null,
    snapshot.ucs_na_fila > 0 && snapshot.ucs_prioritarias === 0
      ? `Nenhuma UC com chance alta de acerto; as ${countFormatter.format(snapshot.ucs_na_fila)} da fila têm chance baixa.`
      : null
  ]
  return notes.filter((note) => note !== null)
}

/**
 * Retrato atual da Fila de Perdas, sem comparação: o histórico de inspeções cobre só ago a dez/2025.
 * Energia e valor contam só as UCs prioritárias, como na aba "Prioritárias" da Fila de Inspeção (ADR-028).
 *
 * @param props - Retrato devolvido pela API.
 * @returns Card com UCs prioritárias, energia, retorno esperado e taxa de acerto das inspeções.
 */
export function LossesSnapshotCard({ snapshot }: { snapshot: LossesSnapshot }) {
  const reference = snapshot.competencia_referencia ? formatMonth(snapshot.competencia_referencia) : 'sem medição'
  const notes = snapshotNotes(snapshot)
  const inspections = snapshot.inspecoes_avaliadas === null
    ? 'taxa geral de referência, sem histórico de campo'
    : `${countFormatter.format(snapshot.inspecoes_avaliadas)} inspeções avaliadas`

  return (
    <Card variant="interactive" data-testid="losses-snapshot">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 pb-2">
        <CardTitle>Fila de Perdas em {reference}</CardTitle>
        <Badge variant="muted">Retrato atual, sem histórico para comparar</Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {notes.length > 0 ? <CardDescription>{notes.join(' ')}</CardDescription> : null}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SnapshotFigure
            label="UCs prioritárias"
            value={formatIndicatorValue(snapshot.ucs_prioritarias, 'UCS')}
            detail={`de ${formatIndicatorValue(snapshot.ucs_na_fila, 'UCS')} na fila`}
          />
          <SnapshotFigure label="Energia recuperável" value={formatMonthlyKwh(snapshot.energia_prioritaria_kwh_mes)} />
          <SnapshotFigure
            label="Retorno esperado por ano"
            value={formatIndicatorValue(snapshot.retorno_esperado_rs_ano, 'RS')}
            detail={`até ${formatIndicatorValue(snapshot.valor_prioritario_rs_ano, 'RS')} se todas confirmarem`}
          />
          <SnapshotFigure
            label="Acerto das inspeções"
            value={formatIndicatorValue(snapshot.taxa_acerto_pct, 'PCT')}
            detail={inspections}
          />
        </div>
      </CardContent>
    </Card>
  )
}
