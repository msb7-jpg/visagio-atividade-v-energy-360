import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip } from '@/components/ui/tooltip-card'
import { formatCompetencia, formatDecimal } from '@/features/grid_quality/utils/qualityFormatters'
import type { QualityIndicators } from '@/features/grid_quality/types/qualityTypes'

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

const LIMIT_NOTE = 'limite de referência'

/**
 * Cards de DEC e FEC médios e de alimentadores acima do limite de referência da competência mais recente.
 *
 * @param props - Indicadores consolidados devolvidos pela API.
 * @returns Grade com os três cards.
 */
export function QualityKpiCards({ indicators }: { indicators: QualityIndicators }) {
  const period = indicators.competencia ? formatCompetencia(indicators.competencia) : 'sem dados'
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
      <KpiCard
        title="Alimentadores acima do limite de referência"
        formula="Acima do limite: DEC ou FEC acumulado no ano maior que o limite anual de referência."
        value={`${formatDecimal(indicators.percentual_violacao)}%`}
        detail={`${indicators.alimentadores_em_violacao} de ${indicators.total_alimentadores} circuitos.`}
      />
    </div>
  )
}
