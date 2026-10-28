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
    <div className="flex flex-col">
      <span className="text-muted-foreground text-xs font-semibold">{label}</span>
      <span className="text-foreground text-sm">
        <span className="font-bold">{current}</span> vs {previous} <span className="font-semibold">({variation})</span>
      </span>
    </div>
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
  const monthsLabel = totals.meses_comparados === 12 ? 'Últimos 12 meses' : `Últimos ${totals.meses_comparados} meses comparáveis`
  return (
    <div className="bg-muted flex flex-wrap gap-x-8 gap-y-2 rounded-lg p-3">
      <TotalItem
        label={`${monthsLabel} · consumo`}
        current={formatKwh(totals.consumo_kwh)}
        previous={formatKwh(totals.consumo_kwh_ano_anterior)}
        variation={formatPercent(totals.variacao_consumo_pct)}
      />
      {totals.valor_total_rs === null
        ? null
        : (
          <TotalItem
            label={`${monthsLabel} · valor faturado`}
            current={formatMoney(totals.valor_total_rs)}
            previous={formatMoney(totals.valor_total_rs_ano_anterior)}
            variation={formatPercent(totals.variacao_valor_pct)}
          />
        )}
    </div>
  )
}
