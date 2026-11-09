import type { ReactNode } from 'react'
import { ArrowDownRight, ArrowUpRight, Minus, Scale } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip-card'
import { ExplanationChips } from '@/features/customer360/components/ExplanationChips'
import type { ConsumptionTrend, HighBillDiagnosis, SolarGeneration } from '@/features/customer360/types/customer360Types'
import { formatPercent, TREND_LABELS } from '@/features/customer360/utils/customer360Formatters'
import {
  describeBillingDays,
  describeConsumption,
  describeEstimatedReading,
  describeFlagChange,
  describeSolar,
  describeTrendCriterion,
  describeTariffChange,
  type Explanation
} from '@/features/customer360/utils/diagnosisMessages'

const TREND_ICONS: Record<ConsumptionTrend, ReactNode> = {
  SUBIU: <ArrowUpRight className="text-destructive size-5" />,
  ESTAVEL: <Minus className="text-muted-foreground size-5" />,
  CAIU: <ArrowDownRight className="text-muted-foreground size-5" />,
  SEM_COMPARACAO: <Scale className="text-muted-foreground size-5" />
}

function collectExplanations(diagnosis: HighBillDiagnosis, solar: SolarGeneration): Explanation[] {
  const explanations = [
    describeEstimatedReading(diagnosis),
    describeBillingDays(diagnosis),
    describeFlagChange(diagnosis),
    describeTariffChange(diagnosis),
    solar.hasSolar ? describeSolar(diagnosis, solar.connectedAt) : null
  ]
  return explanations.filter((explanation): explanation is Explanation => explanation !== null)
}

interface HighBillDiagnosisBannerProps {
  diagnosis: HighBillDiagnosis
  solar: SolarGeneration
}

/**
 * Aviso para o atendente responder na hora a reclamação de conta alta.
 * Veredito visual (variação do consumo em %) e, abaixo, as outras causas em chips:
 * leitura estimada, dias faturados, bandeira tarifária, preço do kWh e geração solar.
 *
 * @param props - Diagnóstico do mês mais recente da UC e a geração solar dela.
 * @returns Card com o veredito de consumo e as demais causas encontradas.
 */
export function HighBillDiagnosisBanner({ diagnosis, solar }: HighBillDiagnosisBannerProps) {
  const trend = diagnosis.tendencia_consumo
  // Só subir ou cair merece destaque; estável e sem comparação ficam discretos.
  const isHighlighted = trend === 'SUBIU' || trend === 'CAIU'
  return (
    <div className="bg-muted/50 border-border flex flex-col gap-3 rounded-md border p-4">
      <span className="text-foreground text-base font-semibold">Conta alta?</span>
      <div className="flex items-center gap-3">
        <div className="bg-card flex size-9 shrink-0 items-center justify-center rounded-md" aria-hidden="true">
          {TREND_ICONS[trend]}
        </div>
        <div className="flex min-w-0 flex-col">
          <div className="flex flex-wrap items-center gap-2">
            <span className={isHighlighted ? 'text-foreground text-2xl font-semibold' : 'text-muted-foreground text-sm'}>
              {formatPercent(diagnosis.variacao_consumo_pct)}
            </span>
            <Tooltip content={describeTrendCriterion()}>
              <Button type="button" variant="inline" size="inline">
                <Badge variant={trend === 'SUBIU' ? 'destructive' : 'secondary'}>{TREND_LABELS[trend]}</Badge>
                <span className="sr-only">: {describeTrendCriterion()}</span>
              </Button>
            </Tooltip>
          </div>
          <p className="text-muted-foreground text-sm">{describeConsumption(diagnosis)}</p>
        </div>
      </div>
      <ExplanationChips explanations={collectExplanations(diagnosis, solar)} />
    </div>
  )
}
