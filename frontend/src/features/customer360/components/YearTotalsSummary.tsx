import { StatTile } from '@/components/data/StatTile'
import type { YearOverYearTotals } from '@/features/customer360/types/customer360Types'
import { formatKwh, formatMoney, formatPercent } from '@/features/customer360/utils/customer360Formatters'

interface TotalItemProps {
  label: string
  current: string
  previous: string
  variation: string
}

function TotalItem({ label, current, previous, variation }: TotalItemProps) {
  return (
    <StatTile
      label={label}
      value={current}
      change={<span className="text-foreground font-semibold tabular-nums">{variation}</span>}
      footnote={`Ano anterior: ${previous}`}
    />
  )
}

interface YearTotalsSummaryProps {
  totals: YearOverYearTotals
}

/**
 * Soma dos últimos 12 meses contra os mesmos meses do ano anterior (consumo e valor faturado).
 *
 * @param props - Totais retornados por `/history`.
 * @returns Faixa com o total de kWh e R$ e suas variações.
 */
export function YearTotalsSummary({ totals }: YearTotalsSummaryProps) {
  const monthsLabel = `${totals.meses_comparados} meses`
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <TotalItem
        label={`Consumo (${monthsLabel})`}
        current={formatKwh(totals.consumo_kwh)}
        previous={formatKwh(totals.consumo_kwh_ano_anterior)}
        variation={formatPercent(totals.variacao_consumo_pct)}
      />
      {totals.valor_total_rs === null
        ? null
        : (
          <TotalItem
            label={`Valor faturado (${monthsLabel})`}
            current={formatMoney(totals.valor_total_rs)}
            previous={formatMoney(totals.valor_total_rs_ano_anterior)}
            variation={formatPercent(totals.variacao_valor_pct)}
          />
        )}
    </div>
  )
}
