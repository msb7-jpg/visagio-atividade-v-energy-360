import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts'
import type { TooltipProps } from 'recharts'
import { ChartContainer, ChartLegendItem, ChartTooltipFrame } from '@/components/ui/chart'
import { YearTotalsSummary } from '@/features/customer360/components/YearTotalsSummary'
import type { MonthlyComparison, YearOverYearTotals } from '@/features/customer360/types/customer360Types'
import {
  formatCompetencia,
  formatDailyKwh,
  formatFlag,
  formatKwh,
  formatMoney,
  formatPercent
} from '@/features/customer360/utils/customer360Formatters'

const CURRENT_YEAR_COLOR = 'var(--color-chart-1)'
const PREVIOUS_YEAR_COLOR = 'var(--color-chart-4)'
const AXIS_TICK = { fill: 'var(--color-muted-foreground)' }

interface ChartRow extends MonthlyComparison {
  mes: string
}

function ConsumptionTooltip({ active, payload }: TooltipProps<number, string>) {
  const row = payload?.[0]?.payload as ChartRow | undefined
  if (!active || !row) {
    return null
  }
  return (
    <ChartTooltipFrame title={`${formatCompetencia(row.competencia)} vs ${formatCompetencia(row.competencia_ano_anterior)}`}>
      <span>Consumo: {formatKwh(row.consumo_kwh)} vs {formatKwh(row.consumo_kwh_ano_anterior)} ({formatPercent(row.variacao_consumo_pct)})</span>
      <span>Valor: {formatMoney(row.valor_total_rs)} vs {formatMoney(row.valor_total_rs_ano_anterior)} ({formatPercent(row.variacao_valor_pct)})</span>
      <span>Por dia: {formatDailyKwh(row.media_diaria_kwh)} vs {formatDailyKwh(row.media_diaria_kwh_ano_anterior)} ({row.dias_faturamento ?? '—'} vs {row.dias_faturamento_ano_anterior ?? '—'} dias)</span>
      <span className="text-muted-foreground">Bandeira: {formatFlag(row.bandeira_tarifaria)}</span>
    </ChartTooltipFrame>
  )
}

function ConsumptionDataTable({ rows }: { rows: ChartRow[] }) {
  return (
    <div className="sr-only">
      <table>
        <caption>Consumo mensal comparado ao mesmo mês do ano anterior</caption>
        <thead>
          <tr>
            <th scope="col">Mês</th>
            <th scope="col">Consumo</th>
            <th scope="col">Ano anterior</th>
            <th scope="col">Variação</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.competencia}>
              <th scope="row">{row.mes}</th>
              <td>{formatKwh(row.consumo_kwh)}</td>
              <td>{formatKwh(row.consumo_kwh_ano_anterior)}</td>
              <td>{formatPercent(row.variacao_consumo_pct)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

interface ConsumptionYoYChartProps {
  months: MonthlyComparison[]
  totals: YearOverYearTotals | null
}

/**
 * Gráfico de barras do consumo dos últimos 12 meses ao lado do mesmo mês do ano anterior.
 *
 * @param props - Meses comparados e totais de 12 meses retornados por `/history`.
 * @returns Gráfico com legenda, tooltip detalhado e tabela acessível equivalente.
 */
export function ConsumptionYoYChart({ months, totals }: ConsumptionYoYChartProps) {
  const rows: ChartRow[] = months.map((month) => ({ ...month, mes: formatCompetencia(month.competencia) }))
  return (
    <div className="flex flex-col gap-3">
      {totals ? <YearTotalsSummary totals={totals} /> : null}
      <div className="flex flex-wrap items-center gap-4">
        <span className="text-foreground text-sm font-semibold">Consumo mensal (kWh)</span>
        <ChartLegendItem label="Últimos 12 meses" series="chart-1" />
        <ChartLegendItem label="Mesmo mês do ano anterior" series="chart-4" />
      </div>
      <ChartContainer label="Consumo em kWh dos últimos 12 meses comparado ao ano anterior">
        <BarChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--color-border)" />
          <XAxis dataKey="mes" tickLine={false} axisLine={false} tick={AXIS_TICK} />
          <YAxis tickLine={false} axisLine={false} tick={AXIS_TICK} width={40} allowDecimals={false} />
          <Tooltip content={<ConsumptionTooltip />} cursor={{ fill: 'var(--color-muted)' }} />
          <Bar dataKey="consumo_kwh_ano_anterior" name="Ano anterior" fill={PREVIOUS_YEAR_COLOR} radius={4} />
          <Bar dataKey="consumo_kwh" name="Últimos 12 meses" fill={CURRENT_YEAR_COLOR} radius={4} />
        </BarChart>
      </ChartContainer>
      <ConsumptionDataTable rows={rows} />
    </div>
  )
}
