import type { CSSProperties } from 'react'
import { StatTile } from '@/components/data/StatTile'
import { QualityStatusBadge } from '@/features/grid_quality/components/QualityStatusBadge'
import { formatCompetencia, formatDecimal } from '@/features/grid_quality/utils/qualityFormatters'
import type { QualityIndicators, QualityStatus } from '@/features/grid_quality/types/qualityTypes'
import { cn } from '@/lib/utils'

const STATUS_ROWS = [
  {
    status: 'violacao',
    bar: 'bg-destructive',
    count: (indicators: QualityIndicators) => indicators.alimentadores_em_violacao,
    percent: (indicators: QualityIndicators) => indicators.percentual_violacao
  },
  {
    status: 'alerta',
    bar: 'bg-warning',
    count: (indicators: QualityIndicators) => indicators.alimentadores_em_alerta,
    percent: (indicators: QualityIndicators) => indicators.percentual_alerta
  },
  {
    status: 'conforme',
    bar: 'bg-success',
    count: (indicators: QualityIndicators) => indicators.alimentadores_conformes,
    percent: (indicators: QualityIndicators) => indicators.percentual_conforme
  }
] as const satisfies readonly { status: QualityStatus; bar: string; count: (indicators: QualityIndicators) => number; percent: (indicators: QualityIndicators) => number }[]

const STATUS_HINT =
  'Acima do limite: DEC ou FEC acumulado no ano maior que o limite anual de referência. Alerta: entre 85% e 100% do limite. Conforme: abaixo de 85%.'

function StatusDistribution({ indicators }: { indicators: QualityIndicators }) {
  return (
    <StatTile
      className="sm:col-span-2"
      label={`Situação dos ${indicators.total_alimentadores} circuitos`}
      hint={STATUS_HINT}
      value={(
        <div className="bg-muted flex h-2.5 w-full overflow-hidden rounded-sm" aria-hidden="true">
          {STATUS_ROWS.map(({ status, bar, percent }) => (
            <div
              key={status}
              className={cn('w-(--segment-width)', bar)}
              style={{ '--segment-width': `${percent(indicators)}%` } as CSSProperties}
            />
          ))}
        </div>
      )}
      footnote={(
        <ul className="flex flex-col gap-1.5 pt-1">
          {STATUS_ROWS.map(({ status, count, percent }) => (
            <li key={status} className="flex items-center justify-between gap-3">
              <QualityStatusBadge status={status} />
              <span className="text-foreground flex gap-3 tabular-nums">
                <span>{count(indicators)} de {indicators.total_alimentadores} circuitos.</span>
                <span className="w-14 text-right font-medium">{formatDecimal(percent(indicators))}%</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    />
  )
}

/**
 * Resumo da Visão atual em uma faixa: DEC e FEC médios acumulados no ano e a distribuição dos circuitos
 * por situação em relação ao limite de referência, na competência mais recente.
 *
 * @param props - Indicadores consolidados devolvidos pela API.
 * @returns Faixa com dois indicadores e o bloco de situação.
 */
export function QualityKpiCards({ indicators }: { indicators: QualityIndicators }) {
  const period = indicators.competencia ? formatCompetencia(indicators.competencia) : 'sem dados'
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatTile
        label="DEC médio no ano (h)"
        hint="DEC acumulado: soma das durações das interrupções (horas) de janeiro até a competência, dividida pelas UCs atendidas do alimentador. Comparado ao limite de referência."
        value={formatDecimal(indicators.dec_medio_horas)}
        footnote={`Média do acumulado no ano até ${period}.`}
      />
      <StatTile
        label="FEC médio no ano (vezes)"
        hint="FEC acumulado: UCs interrompidas de janeiro até a competência, divididas pelas UCs atendidas do alimentador. Comparado ao limite de referência."
        value={formatDecimal(indicators.fec_medio_vezes)}
        footnote={`Média do acumulado no ano até ${period}.`}
      />
      <StatusDistribution indicators={indicators} />
    </div>
  )
}
