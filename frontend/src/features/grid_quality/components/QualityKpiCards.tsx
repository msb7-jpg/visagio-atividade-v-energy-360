import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { QualityStatusBadge } from '@/features/grid_quality/components/QualityStatusBadge'
import { Tooltip } from '@/components/ui/tooltip-card'
import { formatCompetencia, formatDecimal } from '@/features/grid_quality/utils/qualityFormatters'
import type { QualityIndicators, QualityStatus } from '@/features/grid_quality/types/qualityTypes'

interface KpiCardProps {
  title: string
  formula: string
  value: string
  detail: string
}

function KpiCard({ title, formula, value, detail }: KpiCardProps) {
  return (
    <Card variant="glass">
      <CardHeader className="pb-2">
        <Tooltip content={formula}>
          <CardTitle className="cursor-help">{title}</CardTitle>
        </Tooltip>
      </CardHeader>
      <CardContent>
        <div className="text-foreground text-2xl font-bold tracking-tight">{value}</div>
        <CardDescription className="mt-1">{detail}</CardDescription>
      </CardContent>
    </Card>
  )
}

interface StatusCardProps {
  status: QualityStatus
  formula: string
  percent: number
  count: number
  total: number
}

function StatusCard({ status, formula, percent, count, total }: StatusCardProps) {
  return (
    <Card variant="glass">
      <CardHeader className="pb-2">
        <Tooltip content={formula}>
          <span className="w-fit cursor-help"><QualityStatusBadge status={status} /></span>
        </Tooltip>
      </CardHeader>
      <CardContent>
        <div className="text-foreground text-2xl font-bold tracking-tight">{formatDecimal(percent)}%</div>
        <CardDescription className="mt-1">{count} de {total} circuitos.</CardDescription>
      </CardContent>
    </Card>
  )
}

const STATUS_CARDS = [
  {
    status: 'violacao',
    formula: 'Acima do limite: DEC ou FEC acumulado no ano maior que o limite anual de referência.',
    count: (indicators: QualityIndicators) => indicators.alimentadores_em_violacao,
    percent: (indicators: QualityIndicators) => indicators.percentual_violacao
  },
  {
    status: 'alerta',
    formula: 'Alerta: DEC ou FEC acumulado no ano entre 85% e 100% do limite anual de referência.',
    count: (indicators: QualityIndicators) => indicators.alimentadores_em_alerta,
    percent: (indicators: QualityIndicators) => indicators.percentual_alerta
  },
  {
    status: 'conforme',
    formula: 'Conforme: DEC e FEC acumulados no ano abaixo de 85% do limite anual de referência.',
    count: (indicators: QualityIndicators) => indicators.alimentadores_conformes,
    percent: (indicators: QualityIndicators) => indicators.percentual_conforme
  }
] as const

const LIMIT_NOTE = 'limite de referência'

/**
 * Cards de DEC e FEC médios e da distribuição dos alimentadores por situação (acima do limite, alerta, conforme) na competência mais recente.
 *
 * @param props - Indicadores consolidados devolvidos pela API.
 * @returns Duas linhas: DEC/FEC médios e os três cards de situação.
 */
export function QualityKpiCards({ indicators }: { indicators: QualityIndicators }) {
  const period = indicators.competencia ? formatCompetencia(indicators.competencia) : 'sem dados'
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <KpiCard
          title="DEC médio acumulado (horas)"
          formula="DEC acumulado: soma das durações das interrupções (horas) de janeiro até a competência, dividida pelas UCs atendidas do alimentador."
          value={formatDecimal(indicators.dec_medio_horas)}
          detail={`Média do acumulado no ano até ${period}; comparado ao ${LIMIT_NOTE}.`}
        />
        <KpiCard
          title="FEC médio acumulado (vezes)"
          formula="FEC acumulado: UCs interrompidas de janeiro até a competência, divididas pelas UCs atendidas do alimentador."
          value={formatDecimal(indicators.fec_medio_vezes)}
          detail={`Média do acumulado no ano até ${period}; comparado ao ${LIMIT_NOTE}.`}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {STATUS_CARDS.map(({ status, formula, count, percent }) => (
          <StatusCard
            key={status}
            status={status}
            formula={formula}
            percent={percent(indicators)}
            count={count(indicators)}
            total={indicators.total_alimentadores}
          />
        ))}
      </div>
    </div>
  )
}
