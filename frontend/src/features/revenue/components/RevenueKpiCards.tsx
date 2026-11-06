import { RevenueKpiCard } from '@/features/revenue/components/RevenueKpiCard'
import type { RevenueKpis } from '@/features/revenue/types/revenueTypes'
import {
  formatCompactCurrency,
  formatCount,
  formatCurrency,
  formatMwh,
  formatTariff
} from '@/features/revenue/utils/revenueFormatters'

/**
 * Grade com os quatro indicadores executivos do dashboard de receita.
 *
 * @param props - Indicadores devolvidos por `GET /revenue/kpis`.
 * @returns Grade responsiva de cards (1 coluna no celular, 2 no tablet, 4 no desktop).
 */
export function RevenueKpiCards({ kpis }: { kpis: RevenueKpis }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <RevenueKpiCard
        title="Faturamento"
        formula="Soma do valor faturado em todas as competências da janela."
        kpi={kpis.faturamento_rs}
        format={formatCompactCurrency}
        detail={`Base: ${formatCompactCurrency(kpis.faturamento_rs.base)}`}
      />
      <RevenueKpiCard
        title="Volume faturado"
        formula="Soma da energia faturada (kWh) na janela, exibida em MWh."
        kpi={kpis.volume_kwh}
        format={formatMwh}
        detail={`Base: ${formatMwh(kpis.volume_kwh.base)}`}
      />
      <RevenueKpiCard
        title="Tarifa média"
        formula="Faturamento ÷ volume faturado: tarifa média ponderada pelo volume, em R$/kWh."
        kpi={kpis.tarifa_media_rs_kwh}
        format={formatTariff}
        detail={`Base: ${formatTariff(kpis.tarifa_media_rs_kwh.base)}`}
      />
      <RevenueKpiCard
        title="Ticket médio por UC"
        formula={`Faturamento ÷ faturas emitidas (uma por UC por competência): quanto cada UC paga em média. UCs ativas na janela atual: ${formatCount(kpis.ucs_ativas.atual)}.`}
        kpi={kpis.ticket_medio_rs}
        format={formatCurrency}
        detail={`Base: ${formatCurrency(kpis.ticket_medio_rs.base)}`}
      />
    </div>
  )
}
