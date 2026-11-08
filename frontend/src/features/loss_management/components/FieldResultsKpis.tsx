import { StatTile } from '@/components/data/StatTile'
import type { InspectionOrder } from '@/features/loss_management/types/lossTypes'
import { formatMwh } from '@/features/loss_management/utils/backtestFormat'
import { fieldSampleWarning } from '@/features/loss_management/utils/fieldResultsSample'
import { formatInteger, formatPercent } from '@/features/loss_management/utils/lossFormatters'

const EMPTY_VALUE = '—'

interface FieldResultsKpisProps {
  orders: InspectionOrder[]
}

function rateFootnote(completedCount: number, sampleWarning: string | null): string | undefined {
  if (completedCount === 0) return 'Nenhuma ordem concluída ainda'
  return sampleWarning === null ? undefined : `n = ${formatInteger(completedCount)}: amostra pequena`
}

/**
 * Resultados reais de campo das ordens do portal: concluídas, com achado, taxa de acerto e energia recuperada.
 *
 * @param props - Ordens de inspeção; só as concluídas entram na conta.
 * @returns Quatro indicadores e, com poucas ordens concluídas, o aviso de que a taxa ainda não tem significado; a taxa
 * fica em travessão enquanto não há ordem concluída.
 */
export function FieldResultsKpis({ orders }: FieldResultsKpisProps) {
  const completed = orders.filter((order) => order.status === 'concluida')
  const withFinding = completed.filter((order) => order.irregularidade_constatada === true)
  const recoveredKwh = completed.reduce((total, order) => total + (order.kwh_recuperado ?? 0), 0)
  const sampleWarning = fieldSampleWarning(completed.length)

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Ordens concluídas" value={formatInteger(completed.length)} />
        <StatTile label="Com achado" value={formatInteger(withFinding.length)} />
        <StatTile
          label="Taxa de acerto real"
          value={completed.length === 0 ? EMPTY_VALUE : formatPercent(withFinding.length / completed.length)}
          hint="Ordens concluídas com irregularidade constatada ÷ ordens concluídas no portal."
          footnote={rateFootnote(completed.length, sampleWarning)}
        />
        <StatTile
          label="Energia recuperada"
          value={formatMwh(recoveredKwh)}
          hint="Soma do kWh recuperado informado no resultado das ordens concluídas."
        />
      </div>
      {sampleWarning === null ? null : (
        <p role="note" className="text-muted-foreground text-xs">
          {sampleWarning}
        </p>
      )}
    </div>
  )
}
