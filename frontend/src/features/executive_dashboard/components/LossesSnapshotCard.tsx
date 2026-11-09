import { Info } from 'lucide-react'
import { ShareBar } from '@/components/data/ShareBar'
import { StatTile } from '@/components/data/StatTile'
import type { LossesSnapshot } from '@/features/executive_dashboard/types/executiveDashboardTypes'
import { formatIndicatorValue, formatMonthlyKwh } from '@/features/executive_dashboard/utils/indicatorFormatters'

const countFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 })

const HINT_UCS_PRIORITARIAS = 'UCs com queda atípica de consumo e chance de irregularidade de 30% ou mais.'

const HINT_ENERGIA_RECUPERAVEL = 'Energia mensal estimada como desviada nas UCs prioritárias: consumo histórico menos consumo recente.'

const HINT_RETORNO_ESPERADO = 'Energia recuperável × tarifa média × chance de confirmação, em R$ por ano.'

const HINT_ACERTO_INSPECOES = 'Inspeções de campo que confirmaram irregularidade, sobre o total concluído.'

const shareOf = (part: number, whole: number) => (whole > 0 ? (part / whole) * 100 : 0)

/** Rodapé com a barra da parte sobre o todo (ex.: prioritárias sobre a fila) e o texto de referência. */
function ShareFootnote({ percent, tone, children }: { percent: number; tone: string; children: string }) {
  return (
    <span className="flex flex-col gap-1.5 pt-1">
      <ShareBar percent={percent} tone={tone} />
      <span>{children}</span>
    </span>
  )
}

function snapshotNotes(snapshot: LossesSnapshot): string[] {
  const notes = [
    snapshot.ucs_na_fila === 0 ? 'Fila vazia nesta competência.' : null,
    snapshot.ucs_na_fila > 0 && snapshot.ucs_prioritarias === 0
      ? `Nenhuma UC prioritária; ${countFormatter.format(snapshot.ucs_na_fila)} na fila com baixa chance de acerto.`
      : null
  ]
  return notes.filter((note) => note !== null)
}

/**
 * Retrato atual da Fila de Perdas, sem comparação: o histórico de inspeções cobre só ago a dez/2025.
 * O mês de referência fica no título da seção, na página.
 * Energia e valor contam só as UCs prioritárias, como na aba "Prioritárias" da Fila de Inspeção (ADR-028).
 *
 * @param props - Retrato devolvido pela API.
 * @returns Blocos de UCs prioritárias, energia, retorno esperado e acerto das inspeções, e os avisos curtos.
 */
export function LossesSnapshotCard({ snapshot }: { snapshot: LossesSnapshot }) {
  const notes = snapshotNotes(snapshot)
  const inspections = snapshot.inspecoes_avaliadas === null
    ? 'Taxa de referência'
    : `${countFormatter.format(snapshot.inspecoes_avaliadas)} inspeções`

  return (
    <div data-testid="losses-snapshot" className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="UCs prioritárias"
          hint={HINT_UCS_PRIORITARIAS}
          value={formatIndicatorValue(snapshot.ucs_prioritarias, 'UCS')}
          footnote={<ShareFootnote percent={shareOf(snapshot.ucs_prioritarias, snapshot.ucs_na_fila)} tone="bg-warning">{`de ${formatIndicatorValue(snapshot.ucs_na_fila, 'UCS')} na fila`}</ShareFootnote>}
        />
        <StatTile
          label="Energia recuperável"
          hint={HINT_ENERGIA_RECUPERAVEL}
          value={formatMonthlyKwh(snapshot.energia_prioritaria_kwh_mes)}
        />
        <StatTile
          label="Retorno esperado por ano"
          hint={HINT_RETORNO_ESPERADO}
          value={formatIndicatorValue(snapshot.retorno_esperado_rs_ano, 'RS')}
          footnote={<ShareFootnote percent={shareOf(snapshot.retorno_esperado_rs_ano, snapshot.valor_prioritario_rs_ano)} tone="bg-success">{`Potencial: ${formatIndicatorValue(snapshot.valor_prioritario_rs_ano, 'RS')}`}</ShareFootnote>}
        />
        <StatTile
          label="Acerto das inspeções"
          hint={HINT_ACERTO_INSPECOES}
          value={formatIndicatorValue(snapshot.taxa_acerto_pct, 'PCT')}
          footnote={<ShareFootnote percent={snapshot.taxa_acerto_pct} tone="bg-primary">{inspections}</ShareFootnote>}
        />
      </div>
      {notes.length > 0 ? (
        <ul aria-label="Avisos da Fila de Perdas" className="flex flex-col gap-1">
          {notes.map((note) => (
            <li key={note} className="text-muted-foreground flex items-center gap-1.5 text-xs">
              <Info className="size-3.5 shrink-0" aria-hidden="true" />
              {note}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
