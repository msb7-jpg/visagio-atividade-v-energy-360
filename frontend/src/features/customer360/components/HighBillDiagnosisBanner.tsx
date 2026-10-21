import type { ReactNode } from 'react'
import { ArrowDownRight, ArrowUpRight, Minus, Scale } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { ConsumptionTrend, HighBillDiagnosis } from '@/features/customer360/types/customer360Types'
import { TREND_LABELS } from '@/features/customer360/utils/customer360Formatters'
import { describeConsumption, describeFlagChange } from '@/features/customer360/utils/diagnosisMessages'

const TREND_ICONS: Record<ConsumptionTrend, ReactNode> = {
  SUBIU: <ArrowUpRight className="text-destructive size-5" />,
  ESTAVEL: <Minus className="text-primary size-5" />,
  CAIU: <ArrowDownRight className="text-primary size-5" />,
  SEM_COMPARACAO: <Scale className="text-muted-foreground size-5" />
}

const SOLAR_MESSAGE = 'A UC tem geração solar: a energia gerada é abatida do consumo faturado.'

interface HighBillDiagnosisBannerProps {
  diagnosis: HighBillDiagnosis
  hasSolar: boolean
}

/**
 * Aviso para o atendente responder na hora a reclamação de conta alta.
 *
 * @param props - Diagnóstico do mês mais recente da UC e se ela possui geração solar.
 * @returns Card com o veredito de consumo, a mudança de bandeira e o efeito da geração solar.
 */
export function HighBillDiagnosisBanner({ diagnosis, hasSolar }: HighBillDiagnosisBannerProps) {
  const flagMessage = describeFlagChange(diagnosis)
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
          {flagMessage ? <p className="text-muted-foreground text-sm">{flagMessage}</p> : null}
          {hasSolar ? <p className="text-muted-foreground text-sm">{SOLAR_MESSAGE}</p> : null}
        </div>
      </CardContent>
    </Card>
  )
}
