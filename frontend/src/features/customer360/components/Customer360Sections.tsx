import { FileSearch, Receipt, User, Zap } from 'lucide-react'
import { AsyncState } from '@/components/feedback/AsyncState'
import { ConsumptionYoYChart } from '@/features/customer360/components/ConsumptionYoYChart'
import { Customer360Section } from '@/features/customer360/components/Customer360Section'
import { CustomerOverviewCard } from '@/features/customer360/components/CustomerOverviewCard'
import { EventsTab } from '@/features/customer360/components/EventsTab'
import { HighBillDiagnosisBanner } from '@/features/customer360/components/HighBillDiagnosisBanner'
import { InvoicesTab } from '@/features/customer360/components/InvoicesTab'
import { LossInspectionsList } from '@/features/customer360/components/LossInspectionsList'
import type {
  CustomerEventTimeline,
  CustomerHistory,
  CustomerSummary,
  SolarGeneration
} from '@/features/customer360/types/customer360Types'

const RETRY_HINT = 'Verifique a conexão com a API e tente novamente.'

/** Estado de uma consulta da Visão 360 que os blocos precisam para carregar, falhar ou mostrar o conteúdo. */
export interface SectionQuery<Data> {
  data: Data | undefined
  isError: boolean
  retry: () => void
}

function isLoading<Data>(query: SectionQuery<Data>): boolean {
  return !query.data && !query.isError
}

interface ConsumptionSectionProps {
  summary: CustomerSummary
  history: SectionQuery<CustomerHistory>
  events: SectionQuery<CustomerEventTimeline>
}

/**
 * Bloco "Cliente e consumo": quem é o cliente, consumo de 12 meses contra o ano anterior e inspeções de perdas.
 *
 * @param props - Cadastro da UC e as consultas de histórico e eventos.
 * @returns Seção com o cadastro, o gráfico de consumo e as inspeções.
 */
export function ConsumptionSection({ summary, history, events }: ConsumptionSectionProps) {
  return (
    <Customer360Section
      id="bloco-cliente-consumo"
      title="Cliente e consumo"
      description="Cadastro, consumo de 12 meses contra o ano anterior e inspeções de perdas."
      icon={<User className="size-4" />}
    >
      <CustomerOverviewCard summary={summary} />
      <AsyncState
        isLoading={isLoading(history)}
        isError={history.isError}
        isEmpty={history.data?.meses.length === 0}
        errorTitle="Não foi possível carregar o consumo"
        errorDescription={RETRY_HINT}
        onRetry={history.retry}
        emptyTitle="Sem leituras"
        emptyDescription="Ainda não há leituras de consumo para esta unidade."
        emptyIcon={<FileSearch className="size-10" />}
      >
        {history.data ? <ConsumptionYoYChart months={history.data.meses} totals={history.data.resumo_12_meses} /> : null}
      </AsyncState>
      <h3 className="text-foreground text-base font-semibold">Inspeções de perdas</h3>
      <AsyncState
        isLoading={isLoading(events)}
        isError={events.isError}
        errorTitle="Não foi possível carregar as inspeções"
        errorDescription={RETRY_HINT}
        onRetry={events.retry}
      >
        {events.data ? <LossInspectionsList inspections={events.data.inspecoes} /> : null}
      </AsyncState>
    </Customer360Section>
  )
}

/**
 * Bloco "Histórico financeiro": por que a conta veio alta, faturas em aberto, pontualidade e histórico de faturas.
 *
 * @param props - Consulta de histórico e a geração solar da UC.
 * @returns Seção com o diagnóstico de conta alta e as faturas.
 */
export function FinancialSection({ history, solar }: { history: SectionQuery<CustomerHistory>; solar: SolarGeneration }) {
  const diagnosis = history.data?.diagnostico
  return (
    <Customer360Section
      id="bloco-financeiro"
      title="Histórico financeiro"
      description="Por que a conta veio alta, faturas em aberto e pontualidade."
      icon={<Receipt className="size-4" />}
    >
      {diagnosis ? <HighBillDiagnosisBanner diagnosis={diagnosis} solar={solar} /> : null}
      <AsyncState
        isLoading={isLoading(history)}
        isError={history.isError}
        errorTitle="Não foi possível carregar as faturas"
        errorDescription={RETRY_HINT}
        onRetry={history.retry}
      >
        {history.data ? <InvoicesTab history={history.data} /> : null}
      </AsyncState>
    </Customer360Section>
  )
}

/**
 * Bloco "Problemas técnicos": falta de luz na própria UC e na região, e chamados abertos pelo cliente.
 *
 * @param props - Consulta de eventos da UC.
 * @returns Seção com interrupções e chamados.
 */
export function TechnicalSection({ events }: { events: SectionQuery<CustomerEventTimeline> }) {
  return (
    <Customer360Section
      id="bloco-tecnico"
      title="Problemas técnicos"
      description="Falta de luz na unidade e na região, e chamados do cliente."
      icon={<Zap className="size-4" />}
    >
      <AsyncState
        isLoading={isLoading(events)}
        isError={events.isError}
        errorTitle="Não foi possível carregar interrupções e chamados"
        errorDescription={RETRY_HINT}
        onRetry={events.retry}
      >
        {events.data ? <EventsTab events={events.data} /> : null}
      </AsyncState>
    </Customer360Section>
  )
}
