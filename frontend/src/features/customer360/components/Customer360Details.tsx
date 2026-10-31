import { BarChart3, FileSearch, Receipt, ShieldCheck, Zap } from 'lucide-react'
import { AsyncState } from '@/components/feedback/AsyncState'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ConsumptionYoYChart } from '@/features/customer360/components/ConsumptionYoYChart'
import { CustomerQuickFacts } from '@/features/customer360/components/CustomerQuickFacts'
import { EventsTab } from '@/features/customer360/components/EventsTab'
import { HighBillDiagnosisBanner } from '@/features/customer360/components/HighBillDiagnosisBanner'
import { InvoicesTab } from '@/features/customer360/components/InvoicesTab'
import { LossInspectionsList } from '@/features/customer360/components/LossInspectionsList'
import { useCustomerEventsQuery, useCustomerHistoryQuery } from '@/features/customer360/hooks/useCustomer360Queries'
import type { SolarGeneration } from '@/features/customer360/types/customer360Types'
import { buildCustomerInsightMetrics } from '@/features/customer360/utils/insightMetrics'
import { SmartInsightCard } from '@/features/insights/SmartInsightCard'

const RETRY_HINT = 'Verifique a conexão com a API e tente novamente.'

interface Customer360DetailsProps {
  idUc: string
  solar: SolarGeneration
}

/**
 * Diagnóstico de conta alta, resumo rápido, insight de IA e abas de consumo, faturas, interrupções, chamados e inspeções da UC.
 *
 * @param props - Número da UC já encontrada e a geração solar dela.
 * @returns Aviso de conta alta, cards de resumo e abas da Visão 360.
 */
export function Customer360Details({ idUc, solar }: Customer360DetailsProps) {
  const historyQuery = useCustomerHistoryQuery(idUc)
  const eventsQuery = useCustomerEventsQuery(idUc)
  const history = historyQuery.data
  const events = eventsQuery.data
  const isHistoryLoading = !history && !historyQuery.isError
  const diagnosis = history?.diagnostico
  const openInvoicesCount = history?.faturas_em_aberto.length ?? 0
  const retryHistory = () => void historyQuery.refetch()
  const retryEvents = () => void eventsQuery.refetch()

  return (
    <div className="flex flex-col gap-4">
      {diagnosis ? <HighBillDiagnosisBanner diagnosis={diagnosis} solar={solar} /> : null}
      <CustomerQuickFacts history={history} events={events} />
      {history && events ? (
        <SmartInsightCard
          context="customer360"
          filters={{ id_uc: idUc }}
          metrics={buildCustomerInsightMetrics(history, events, solar)}
        />
      ) : null}
      <Tabs defaultValue="consumption">
        <TabsList className="flex-wrap">
          <TabsTrigger value="consumption">
            <span className="flex items-center gap-1.5"><BarChart3 className="size-4" /> Consumo</span>
          </TabsTrigger>
          <TabsTrigger value="invoices">
            <span className="flex items-center gap-1.5">
              <Receipt className="size-4" />
              <span>
                Faturas{openInvoicesCount > 0 ? <span className="hidden sm:inline"> ({openInvoicesCount} em aberto)</span> : null}
              </span>
            </span>
          </TabsTrigger>
          <TabsTrigger value="events">
            <span className="flex items-center gap-1.5">
              <Zap className="size-4" />
              <span>Interrupções<span className="hidden sm:inline"> e Chamados</span></span>
            </span>
          </TabsTrigger>
          <TabsTrigger value="inspections">
            <span className="flex items-center gap-1.5"><ShieldCheck className="size-4" /> Inspeções</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="consumption" className="mt-4 min-w-0">
          <AsyncState
            isLoading={isHistoryLoading}
            isError={historyQuery.isError}
            isEmpty={history?.meses.length === 0}
            errorTitle="Não foi possível carregar o consumo"
            errorDescription={RETRY_HINT}
            onRetry={retryHistory}
            emptyTitle="Sem leituras"
            emptyDescription="Ainda não há leituras de consumo para esta unidade."
            emptyIcon={<FileSearch className="size-10" />}
          >
            {history ? <ConsumptionYoYChart months={history.meses} totals={history.resumo_12_meses} /> : null}
          </AsyncState>
        </TabsContent>
        <TabsContent value="invoices" className="mt-4 min-w-0">
          <AsyncState
            isLoading={isHistoryLoading}
            isError={historyQuery.isError}
            errorTitle="Não foi possível carregar as faturas"
            errorDescription={RETRY_HINT}
            onRetry={retryHistory}
          >
            {history ? <InvoicesTab history={history} /> : null}
          </AsyncState>
        </TabsContent>
        <TabsContent value="events" className="mt-4 min-w-0">
          <AsyncState
            isLoading={!events && !eventsQuery.isError}
            isError={eventsQuery.isError}
            errorTitle="Não foi possível carregar interrupções e chamados"
            errorDescription={RETRY_HINT}
            onRetry={retryEvents}
          >
            {events ? <EventsTab events={events} /> : null}
          </AsyncState>
        </TabsContent>
        <TabsContent value="inspections" className="mt-4 min-w-0">
          <AsyncState
            isLoading={!events && !eventsQuery.isError}
            isError={eventsQuery.isError}
            errorTitle="Não foi possível carregar as inspeções"
            errorDescription={RETRY_HINT}
            onRetry={retryEvents}
          >
            {events ? <LossInspectionsList inspections={events.inspecoes} /> : null}
          </AsyncState>
        </TabsContent>
      </Tabs>
    </div>
  )
}
