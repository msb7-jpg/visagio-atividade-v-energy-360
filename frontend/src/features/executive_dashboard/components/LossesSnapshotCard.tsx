import { Info } from 'lucide-react'
import { StatTile } from '@/components/data/StatTile'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip-card'
import type { LossesSnapshot } from '@/features/executive_dashboard/types/executiveDashboardTypes'
import { formatMonth } from '@/lib/periods/periodPresets'
import { formatIndicatorValue, formatMonthlyKwh } from '@/features/executive_dashboard/utils/indicatorFormatters'

const countFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 })

const NO_COMPARISON_HINT = 'Retrato da Fila de Perdas na competência de referência. Não é comparado com outro período por decisão: o histórico de inspeções cobre só ago a dez/2025.'
const HINT_UCS_PRIORITARIAS =
  'Unidades consumidoras com queda atípica de consumo e chance calculada de irregularidade acima de 30%, priorizadas para envio de equipe a campo.'

const HINT_ENERGIA_RECUPERAVEL =
  'Soma do volume mensal estimado de energia desviada (kWh/mês) em todas as UCs prioritárias da fila, medido pela diferença entre o consumo histórico normal e o consumo recente após a queda.'

const HINT_ACERTO_INSPECOES =
  'Percentual de inspeções realizadas em campo que confirmaram irregularidade material ou furto no medidor (taxa histórica de assertividade das ordens concluídas).'

const EXPECTED_RETURN_HINT = 'Valor por ano das UCs prioritárias, ponderado pela chance de acerto de cada uma. O teto é o valor se todas confirmarem a irregularidade.'

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
 * Mesmo padrão dos outros grupos do Painel (mesmos blocos, mesma grade); o selo explica no tooltip que a falta de
 * comparação é uma decisão. Energia e valor contam só as UCs prioritárias, como na aba "Prioritárias" (ADR-028).
 *
 * @param props - Retrato devolvido pela API.
 * @returns Blocos de UCs prioritárias, energia, retorno esperado e acerto das inspeções, e os avisos curtos.
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
        <Tooltip content={NO_COMPARISON_HINT}>
          <Button type="button" variant="inline" size="inline">
            <Badge variant="muted">Retrato atual, sem comparação</Badge>
            <span className="sr-only">: {NO_COMPARISON_HINT}</span>
          </Button>
        </Tooltip>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="UCs prioritárias"
          hint={HINT_UCS_PRIORITARIAS}
          value={formatIndicatorValue(snapshot.ucs_prioritarias, 'UCS')}
          footnote={`de ${formatIndicatorValue(snapshot.ucs_na_fila, 'UCS')} na fila`}
        />
        <StatTile
          label="Energia recuperável"
          hint={HINT_ENERGIA_RECUPERAVEL}
          value={formatMonthlyKwh(snapshot.energia_prioritaria_kwh_mes)}
        />
        <StatTile
          label="Retorno esperado por ano"
          hint={EXPECTED_RETURN_HINT}
          value={formatIndicatorValue(snapshot.retorno_esperado_rs_ano, 'RS')}
          footnote={`Teto de ${formatIndicatorValue(snapshot.valor_prioritario_rs_ano, 'RS')}`}
        />
        <StatTile
          label="Acerto das inspeções"
          hint={HINT_ACERTO_INSPECOES}
          value={formatIndicatorValue(snapshot.taxa_acerto_pct, 'PCT')}
          footnote={inspections}
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
