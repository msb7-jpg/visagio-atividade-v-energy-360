import { StatTile } from '@/components/data/StatTile'
import { VariationBadge } from '@/features/revenue/components/VariationBadge'
import type { KpiValue } from '@/features/revenue/types/revenueTypes'

interface RevenueKpiCardProps {
  title: string
  formula: string
  kpi: KpiValue
  format: (value: number | null) => string
  detail: string
}

/**
 * Indicador da Receita: valor atual em destaque, variação contra a janela base e a referência da base.
 * A fórmula fica no ícone de ajuda do título.
 *
 * @param props - Título, fórmula, indicador, formatador do valor e linha de apoio.
 * @returns Bloco de indicador agrupado para leitores de tela pelo título.
 */
export function RevenueKpiCard({ title, formula, kpi, format, detail }: RevenueKpiCardProps) {
  return (
    <div role="group" aria-label={title} className="flex">
      <StatTile
        className="flex-1"
        label={title}
        hint={formula}
        value={format(kpi.atual)}
        change={<VariationBadge variation={kpi.variacao_pct} />}
        footnote={detail}
      />
    </div>
  )
}
