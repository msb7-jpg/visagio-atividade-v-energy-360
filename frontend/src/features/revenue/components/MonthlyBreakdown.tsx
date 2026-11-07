import type { MonthlyPoint } from '@/features/revenue/types/revenueTypes'
import { formatCompactCurrency, formatMwh, formatTariff } from '@/features/revenue/utils/revenueFormatters'
import { formatMonth } from '@/lib/periods/periodPresets'

const MONTHS = 12
const HALF = MONTHS / 2
const HEADERS = ['Mês', 'Receita', 'Volume', 'Tarifa média']

function MonthsBlock({ points }: { points: MonthlyPoint[] }) {
  return (
    <div className="grid grid-cols-4 gap-x-4 gap-y-1.5 text-xs tabular-nums">
      {HEADERS.map((header, index) => (
        <span key={header} className={index === 0 ? 'text-muted-foreground font-medium' : 'text-muted-foreground text-right font-medium'}>
          {header}
        </span>
      ))}
      {points.map((point) => (
        <div key={point.competencia} className="contents">
          <span className="text-muted-foreground">{formatMonth(point.competencia)}</span>
          <span className="text-foreground text-right font-medium whitespace-nowrap">{formatCompactCurrency(point.receita_rs)}</span>
          <span className="text-foreground text-right whitespace-nowrap">{formatMwh(point.volume_kwh)}</span>
          <span className="text-foreground text-right whitespace-nowrap">{formatTariff(point.tarifa_media_rs_kwh)}</span>
        </div>
      ))}
    </div>
  )
}

/**
 * Receita, volume e tarifa média de cada um dos últimos 12 meses do bairro, abertos na própria linha da tabela:
 * dois blocos de seis meses lado a lado, uma linha por mês, para caber sem alargar a tabela.
 *
 * @param props - Pontos mensais do bairro.
 * @returns Os 12 meses mais recentes, do mais antigo para o mais novo.
 */
export function MonthlyBreakdown({ points }: { points: MonthlyPoint[] }) {
  const recent = points.slice(-MONTHS)
  return (
    <div className="grid grid-cols-1 gap-x-10 gap-y-4 lg:grid-cols-2">
      <MonthsBlock points={recent.slice(0, HALF)} />
      <MonthsBlock points={recent.slice(HALF)} />
    </div>
  )
}
