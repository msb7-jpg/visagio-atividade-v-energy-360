import type { ReactNode } from 'react'
import { PriorInspectionsList } from '@/features/loss_management/components/PriorInspectionsList'
import { UnitConsumptionChart } from '@/features/loss_management/components/UnitConsumptionChart'
import { UnitScoreCalculation } from '@/features/loss_management/components/UnitScoreCalculation'
import type { UnitDetail } from '@/features/loss_management/types/unitDetailTypes'
import { describeReasons } from '@/features/loss_management/utils/lossFormatters'

interface SectionProps {
  title: string
  children: ReactNode
}

function Section({ title, children }: SectionProps) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-foreground text-sm font-semibold">{title}</h3>
      {children}
    </section>
  )
}

interface UnitDetailBodyProps {
  detail: UnitDetail
}

/**
 * Corpo do painel de detalhe: motivo, conta do score, consumo de 12 meses e inspeções anteriores.
 *
 * A frase do motivo é montada por regra no backend a partir dos números da UC, por isso não leva o rótulo de IA.
 *
 * @param props - Detalhe da UC devolvido pela API.
 * @returns Seções empilhadas do painel.
 */
export function UnitDetailBody({ detail }: UnitDetailBodyProps) {
  return (
    <div className="flex flex-col gap-6">
      <Section title="Por que está na fila">
        <p className="text-foreground text-sm font-medium">{describeReasons(detail.motivos)}</p>
        <p className="text-muted-foreground text-sm">{detail.motivo_resumo}</p>
      </Section>
      <Section title="Como o score é calculado">
        <UnitScoreCalculation breakdown={detail.decomposicao_score} />
      </Section>
      <Section title="Consumo nos últimos 12 meses">
        <UnitConsumptionChart months={detail.consumo_mensal} />
      </Section>
      <Section title="Inspeções anteriores">
        <PriorInspectionsList inspections={detail.inspecoes_anteriores} />
      </Section>
    </div>
  )
}
