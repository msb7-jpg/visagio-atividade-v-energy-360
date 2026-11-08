import { StatTile } from '@/components/data/StatTile'
import type { InspectionOrder } from '@/features/loss_management/types/lossTypes'
import { formatMwh } from '@/features/loss_management/utils/backtestFormat'
import { formatInteger, formatPercent } from '@/features/loss_management/utils/lossFormatters'

const EMPTY_VALUE = '—'

interface FieldResultsKpisProps {
  orders: InspectionOrder[]
}

/**
 * Resultados reais de campo das ordens do portal: concluídas, com achado, taxa de acerto e energia recuperada.
 *
 * @param props - Ordens de inspeção; só as concluídas entram na conta.
 * @returns Quatro indicadores; a taxa fica em travessão enquanto não há ordem concluída.
 */
export function FieldResultsKpis({ orders }: FieldResultsKpisProps) {
  const completed = orders.filter((order) => order.status === 'concluida')
  const withFinding = completed.filter((order) => order.irregularidade_constatada === true)
  const recoveredKwh = completed.reduce((total, order) => total + (order.kwh_recuperado ?? 0), 0)

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <StatTile label="Ordens concluídas" value={formatInteger(completed.length)} />
      <StatTile label="Com achado" value={formatInteger(withFinding.length)} />
      <StatTile
        label="Taxa de acerto real"
        value={completed.length === 0 ? EMPTY_VALUE : formatPercent(withFinding.length / completed.length)}
        hint="Ordens concluídas com irregularidade constatada ÷ ordens concluídas no portal."
        footnote={completed.length === 0 ? 'Nenhuma ordem concluída ainda' : undefined}
      />
      <StatTile
        label="Energia recuperada"
        value={formatMwh(recoveredKwh)}
        hint="Soma do kWh recuperado informado no resultado das ordens concluídas."
      />
    </div>
  )
}
