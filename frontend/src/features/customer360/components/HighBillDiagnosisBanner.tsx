import type { ReactNode } from 'react'
import { ArrowDownRight, ArrowUpRight, Minus, Scale } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { ConsumptionTrend, HighBillDiagnosis } from '@/features/customer360/types/customer360Types'
import { TREND_LABELS } from '@/features/customer360/utils/customer360Formatters'
import {
  describeBillingDays,
  describeConsumption,
  describeFlagChange,
  describeTariffChange
} from '@/features/customer360/utils/diagnosisMessages'

const TREND_ICONS: Record<ConsumptionTrend, ReactNode> = {
  SUBIU: <ArrowUpRight className="text-destructive size-5" />,
  ESTAVEL: <Minus className="text-primary size-5" />,
  CAIU: <ArrowDownRight className="text-primary size-5" />,
  SEM_COMPARACAO: <Scale className="text-muted-foreground size-5" />
}

const SOLAR_MESSAGE = 'A UC tem geração solar: a energia gerada é abatida do consumo faturado.'

function collectExplanations(diagnosis: HighBillDiagnosis, hasSolar: boolean): string[] {
  const explanations = [
    describeBillingDays(diagnosis),
    describeFlagChange(diagnosis),
    describeTariffChange(diagnosis),
    hasSolar ? SOLAR_MESSAGE : null
  ]
  return explanations.filter((explanation): explanation is string => explanation !== null)
}

interface HighBillDiagnosisBannerProps {
  diagnosis: HighBillDiagnosis
  hasSolar: boolean
}

/**
 * Aviso para o atendente responder na hora a reclamação de conta alta.
 * Cobre as quatro causas: consumo, dias faturados, bandeira tarifária e preço do kWh, além do efeito da geração solar.
 *
 * @param props - Diagnóstico do mês mais recente da UC e se ela possui geração solar.
 * @returns Card com o veredito de consumo e as demais explicações encontradas.
 */
export function HighBillDiagnosisBanner({ diagnosis, hasSolar }: HighBillDiagnosisBannerProps) {
  const explanations = collectExplanations(diagnosis, hasSolar)
  return (
    <Card>
      <CardContent className="flex items-start gap-3 pt-6">
        <div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-xl">
          {TREND_ICONS[diagnosis.tendencia_consumo]}
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-foreground text-sm font-bold">Conta alta?</span>
            <Badge variant={diagnosis.tendencia_consumo === 'SUBIU' ? 'destructive' : 'secondary'}>
              {TREND_LABELS[diagnosis.tendencia_consumo]}
            </Badge>
          </div>
          <p className="text-foreground text-sm">{describeConsumption(diagnosis)}</p>
          {explanations.length > 0
            ? (
              <ul aria-label="Outras explicações para o valor da conta" className="text-muted-foreground flex list-disc flex-col gap-1 pl-5 text-sm">
                {explanations.map((explanation) => <li key={explanation}>{explanation}</li>)}
              </ul>
            )
            : null}
        </div>
      </CardContent>
    </Card>
  )
}
