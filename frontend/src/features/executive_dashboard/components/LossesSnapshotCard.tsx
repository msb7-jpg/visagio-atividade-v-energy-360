import { StatTile } from '@/components/data/StatTile'
import { Badge } from '@/components/ui/badge'
import type { LossesSnapshot } from '@/features/executive_dashboard/types/executiveDashboardTypes'
import { formatMonth } from '@/features/executive_dashboard/utils/dashboardPeriods'
import { formatIndicatorValue, formatMonthlyKwh } from '@/features/executive_dashboard/utils/indicatorFormatters'

const countFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 })

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
 * @returns Bloco com UCs prioritárias, energia, retorno esperado e taxa de acerto das inspeções.
 */
export function LossesSnapshotCard({ snapshot }: { snapshot: LossesSnapshot }) {
  const reference = snapshot.competencia_referencia ? formatMonth(snapshot.competencia_referencia) : 'sem medição'
  const notes = snapshotNotes(snapshot)
  const inspections = snapshot.inspecoes_avaliadas === null
    ? 'taxa geral de referência, sem histórico de campo'
    : `${countFormatter.format(snapshot.inspecoes_avaliadas)} inspeções avaliadas`

  return (
    <div data-testid="losses-snapshot" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-foreground text-sm font-medium">Fila de Perdas em {reference}</span>
        <Badge variant="muted">Retrato atual, sem comparação</Badge>
      </div>
      {notes.length > 0 ? <p className="text-muted-foreground text-xs">{notes.join(' ')}</p> : null}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="UCs prioritárias"
          value={formatIndicatorValue(snapshot.ucs_prioritarias, 'UCS')}
          footnote={`de ${formatIndicatorValue(snapshot.ucs_na_fila, 'UCS')} na fila`}
        />
        <StatTile label="Energia recuperável" value={formatMonthlyKwh(snapshot.energia_prioritaria_kwh_mes)} />
        <StatTile
          label="Retorno esperado por ano"
          value={formatIndicatorValue(snapshot.retorno_esperado_rs_ano, 'RS')}
          footnote={`até ${formatIndicatorValue(snapshot.valor_prioritario_rs_ano, 'RS')} se todas confirmarem`}
        />
        <StatTile
          label="Acerto das inspeções"
          value={formatIndicatorValue(snapshot.taxa_acerto_pct, 'PCT')}
          footnote={inspections}
        />
      </div>
    </div>
  )
}
