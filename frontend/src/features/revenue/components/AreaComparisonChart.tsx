import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ComparisonLineChart } from '@/features/revenue/components/ComparisonLineChart'
import { MAX_COMPARED_AREAS, useAreaComparison } from '@/features/revenue/hooks/useAreaComparison'
import type { MonthlyPoint } from '@/features/revenue/types/revenueTypes'
import type { AreaRevenue } from '@/features/revenue/utils/areaRevenue'
import { HISTORY_METRICS, type HistoryMetricKey } from '@/features/revenue/utils/revenueHistoryMetrics'

const UNITS: Record<HistoryMetricKey, string> = {
  receita_rs: 'R$ por mês',
  volume_kwh: 'MWh por mês',
  tarifa_media_rs_kwh: 'R$ por kWh'
}

interface AreaComparisonChartProps {
  areas: AreaRevenue[]
  histories: Map<string, MonthlyPoint[]>
}

/**
 * Gráfico único para comparar bairros: o usuário escolhe a métrica (receita, volume ou tarifa) e até 5 bairros da
 * página. A métrica e a unidade ficam no título, e todas as linhas dividem a mesma escala. Usa as séries mensais
 * que a tabela já consulta, sem chamada nova.
 *
 * @param props - Bairros da página atual e as séries mensais já carregadas.
 * @returns Seção com título, seletor de métrica, escolha de bairros e o gráfico.
 */
export function AreaComparisonChart({ areas, histories }: AreaComparisonChartProps) {
  const { metric, changeMetric, options, selectedKeys, selected, toggle } = useAreaComparison(areas, histories)
  return (
    <section aria-labelledby="comparacao-bairros" className="border-border flex flex-col gap-4 rounded-md border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h3 id="comparacao-bairros" className="text-foreground text-base font-semibold">
            {metric.seriesLabel} por bairro · {UNITS[metric.key]}
          </h3>
          <p className="text-muted-foreground text-sm">Escolha a métrica e até {MAX_COMPARED_AREAS} bairros desta página. Todos usam a mesma escala.</p>
        </div>
        <Tabs value={metric.key} onValueChange={(next) => changeMetric(next as HistoryMetricKey)}>
          <TabsList aria-label="Métrica do gráfico">
            {HISTORY_METRICS.map((option) => <TabsTrigger key={option.key} value={option.key}>{option.tabLabel}</TabsTrigger>)}
          </TabsList>
        </Tabs>
      </div>
      {options.length === 0 ? <p className="text-muted-foreground text-sm">Carregando o histórico dos bairros…</p> : (
        <>
          <ul aria-label="Bairros comparados" className="flex flex-wrap gap-x-4 gap-y-2">
            {options.map((option) => {
              const isSelected = selectedKeys.includes(option.key)
              const isLocked = isSelected ? selectedKeys.length === 1 : selectedKeys.length >= MAX_COMPARED_AREAS
              return (
                <li key={option.key} className="flex items-center gap-2 text-sm">
                  <Checkbox id={`comparar-${option.key}`} checked={isSelected} disabled={isLocked} onCheckedChange={() => toggle(option.key)} />
                  <label htmlFor={`comparar-${option.key}`} className="text-foreground">{option.name}</label>
                </li>
              )
            })}
          </ul>
          <ComparisonLineChart series={selected} metric={metric} />
        </>
      )}
    </section>
  )
}
