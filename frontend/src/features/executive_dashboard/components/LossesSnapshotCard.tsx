import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { LossesSnapshot } from '@/features/executive_dashboard/types/executiveDashboardTypes'
import { formatMonth } from '@/features/executive_dashboard/utils/dashboardPeriods'
import { formatIndicatorValue, formatMonthlyKwh } from '@/features/executive_dashboard/utils/indicatorFormatters'

function SnapshotFigure({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <CardDescription>{label}</CardDescription>
      <div className="text-foreground font-mono tabular-nums text-2xl font-bold tracking-tight">{value}</div>
    </div>
  )
}

/**
 * Retrato atual da Fila de Perdas, sem comparação: o histórico de inspeções cobre só ago a dez/2025.
 *
 * @param props - Retrato devolvido pela API.
 * @returns Card com UCs na fila, energia e valor recuperáveis e taxa de acerto das inspeções.
 */
export function LossesSnapshotCard({ snapshot }: { snapshot: LossesSnapshot }) {
  const reference = snapshot.competencia_referencia ? formatMonth(snapshot.competencia_referencia) : 'sem medição'
  const notes = [
    snapshot.competencia_fixada ? 'Competência fixada para a demonstração, e não a mais recente.' : null,
    snapshot.ucs_na_fila === 0 ? 'Nenhuma UC com queda suspeita nesta competência.' : null
  ].filter((note) => note !== null)
  const inspections = snapshot.inspecoes_avaliadas === null
    ? 'taxa geral de referência, sem histórico de campo'
    : `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(snapshot.inspecoes_avaliadas)} inspeções avaliadas`

  return (
    <Card variant="interactive" data-testid="losses-snapshot">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 pb-2">
        <CardTitle>Fila de Perdas em {reference}</CardTitle>
        <Badge variant="muted">Retrato atual, sem histórico para comparar</Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {notes.length > 0 ? <CardDescription>{notes.join(' ')}</CardDescription> : null}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SnapshotFigure label="UCs suspeitas na fila" value={formatIndicatorValue(snapshot.ucs_na_fila, 'UCS')} />
          <SnapshotFigure label="Energia recuperável" value={formatMonthlyKwh(snapshot.energia_recuperavel_kwh_mes)} />
          <SnapshotFigure
            label="Valor recuperável por ano"
            value={formatIndicatorValue(snapshot.valor_recuperavel_rs_ano, 'RS')}
          />
          <div className="flex flex-col gap-1">
            <SnapshotFigure label="Acerto das inspeções" value={formatIndicatorValue(snapshot.taxa_acerto_pct, 'PCT')} />
            <CardDescription>{inspections}</CardDescription>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
