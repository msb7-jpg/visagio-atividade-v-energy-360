import type { ReactNode } from 'react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  /** Consumo desde a primeira leitura da UC, em vez dos 12 últimos meses. */
  fullHistory: boolean
  onFullHistoryChange: (fullHistory: boolean) => void
}

/**
 * Corpo do painel de detalhe: motivo, conta do score, consumo mensal e inspeções anteriores.
 *
 * A frase do motivo é montada por regra no backend a partir dos números da UC, por isso não leva o rótulo de IA.
 *
 * @param props - Detalhe da UC devolvido pela API e o período escolhido para o gráfico de consumo.
 * @returns Seções empilhadas do painel.
 */
export function UnitDetailBody({ detail, fullHistory, onFullHistoryChange }: UnitDetailBodyProps) {
  return (
    <div className="flex flex-col gap-6">
      <Section title="Por que está na fila">
        <p className="text-foreground text-sm font-medium">{describeReasons(detail.motivos)}</p>
        <p className="text-muted-foreground text-sm">{detail.motivo_resumo}</p>
      </Section>
      <Section title="Como o score é calculado">
        <UnitScoreCalculation breakdown={detail.decomposicao_score} />
      </Section>
      <Section title={fullHistory ? 'Consumo no histórico da UC' : 'Consumo nos últimos 12 meses'}>
        <Tabs value={fullHistory ? 'tudo' : '12m'} onValueChange={(value) => onFullHistoryChange(value === 'tudo')}>
          <TabsList>
            <TabsTrigger value="12m">12 meses</TabsTrigger>
            <TabsTrigger value="tudo">Tudo</TabsTrigger>
          </TabsList>
        </Tabs>
        <UnitConsumptionChart months={detail.consumo_mensal} fullHistory={fullHistory} />
      </Section>
      <Section title="Inspeções anteriores">
        <PriorInspectionsList inspections={detail.inspecoes_anteriores} />
      </Section>
    </div>
  )
}
