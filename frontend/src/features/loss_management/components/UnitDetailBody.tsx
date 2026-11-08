import type { ReactNode } from 'react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PriorInspectionsList } from '@/features/loss_management/components/PriorInspectionsList'
import { UnitConsumptionChart } from '@/features/loss_management/components/UnitConsumptionChart'
import { UnitDropSummary } from '@/features/loss_management/components/UnitDropSummary'
import { UnitScoreCalculation } from '@/features/loss_management/components/UnitScoreCalculation'
import type { UnitDetail } from '@/features/loss_management/types/unitDetailTypes'

interface SectionProps {
  title: string
  /** Controle à direita do rótulo, como o seletor de período do gráfico. */
  action?: ReactNode
  children: ReactNode
}

function Section({ title, action, children }: SectionProps) {
  return (
    <section className="flex flex-col gap-3 py-5 first:pt-0 last:pb-0">
      <div className="flex min-h-8 items-center justify-between gap-3">
        <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">{title}</h3>
        {action}
      </div>
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
 * Corpo do painel de detalhe: motivo, score, consumo mensal e inspeções anteriores, separados por linhas finas.
 *
 * A frase do motivo é montada por regra no backend a partir dos números da UC, por isso não leva o rótulo de IA.
 *
 * @param props - Detalhe da UC devolvido pela API e o período escolhido para o gráfico de consumo.
 * @returns Seções empilhadas do painel.
 */
export function UnitDetailBody({ detail, fullHistory, onFullHistoryChange }: UnitDetailBodyProps) {
  const periodTabs = (
    <Tabs value={fullHistory ? 'tudo' : '12m'} onValueChange={(value) => onFullHistoryChange(value === 'tudo')}>
      <TabsList aria-label="Período do consumo">
        <TabsTrigger value="12m">12 meses</TabsTrigger>
        <TabsTrigger value="tudo">Tudo</TabsTrigger>
      </TabsList>
    </Tabs>
  )
  return (
    <div className="divide-border flex flex-col divide-y">
      <Section title="Por que está na fila">
        <UnitDropSummary detail={detail} />
      </Section>
      <Section title="Score de prioridade">
        <UnitScoreCalculation breakdown={detail.decomposicao_score} />
      </Section>
      <Section title={fullHistory ? 'Consumo desde a 1ª leitura' : 'Consumo mensal'} action={periodTabs}>
        <UnitConsumptionChart
          months={detail.consumo_mensal}
          fullHistory={fullHistory}
          averages={{ baseKwh: detail.consumo_base_kwh, recentKwh: detail.consumo_recente_kwh }}
        />
      </Section>
      <Section title="Inspeções anteriores">
        <PriorInspectionsList inspections={detail.inspecoes_anteriores} />
      </Section>
    </div>
  )
}
