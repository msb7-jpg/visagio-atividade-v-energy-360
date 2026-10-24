import { BarChart3, FileSearch, Receipt, Zap } from 'lucide-react'
import { AsyncState } from '@/components/feedback/AsyncState'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ConsumptionYoYChart } from '@/features/customer360/components/ConsumptionYoYChart'
import { CustomerQuickFacts } from '@/features/customer360/components/CustomerQuickFacts'
import { EventsTab } from '@/features/customer360/components/EventsTab'
import { HighBillDiagnosisBanner } from '@/features/customer360/components/HighBillDiagnosisBanner'
import { InvoicesTab } from '@/features/customer360/components/InvoicesTab'
import { useCustomerEventsQuery, useCustomerHistoryQuery } from '@/features/customer360/hooks/useCustomer360Queries'

const RETRY_HINT = 'Verifique a conexão com a API e tente buscar a unidade novamente.'

interface Customer360DetailsProps {
  idUc: string
  hasSolar: boolean
}

/**
 * Diagnóstico de conta alta, resumo rápido e abas de consumo, faturas, interrupções e chamados da UC.
 *
 * @param props - Número da UC já encontrada e se ela possui geração solar.
 * @returns Aviso de conta alta, cards de resumo e abas da Visão 360.
 */
export function Customer360Details({ idUc, hasSolar }: Customer360DetailsProps) {
  const historyQuery = useCustomerHistoryQuery(idUc)
  const eventsQuery = useCustomerEventsQuery(idUc)
  const history = historyQuery.data
  const events = eventsQuery.data
  const isHistoryLoading = !history && !historyQuery.isError
  const diagnosis = history?.diagnostico
  const openInvoicesCount = history?.faturas_em_aberto.length ?? 0

  return (
    <div className="flex flex-col gap-4">
      {diagnosis ? <HighBillDiagnosisBanner diagnosis={diagnosis} hasSolar={hasSolar} /> : null}
      <CustomerQuickFacts history={history} events={events} />
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
        </TabsList>
        <TabsContent value="consumption" className="mt-4 min-w-0">
          <AsyncState
            isLoading={isHistoryLoading}
            isError={historyQuery.isError}
            isEmpty={history?.meses.length === 0}
            errorTitle="Não foi possível carregar o consumo"
            errorDescription={RETRY_HINT}
            emptyTitle="Sem leituras"
            emptyDescription="Ainda não há leituras de consumo para esta unidade."
            emptyIcon={<FileSearch className="size-10" />}
          >
            {history ? <ConsumptionYoYChart months={history.meses} totals={history.resumo_12_meses} /> : null}
          </AsyncState>
        </TabsContent>
        <TabsContent value="invoices" className="mt-4 min-w-0">
          <AsyncState isLoading={isHistoryLoading} isError={historyQuery.isError} errorTitle="Não foi possível carregar as faturas" errorDescription={RETRY_HINT}>
            {history ? <InvoicesTab history={history} /> : null}
          </AsyncState>
        </TabsContent>
        <TabsContent value="events" className="mt-4 min-w-0">
          <AsyncState
            isLoading={!events && !eventsQuery.isError}
            isError={eventsQuery.isError}
            errorTitle="Não foi possível carregar interrupções e chamados"
            errorDescription={RETRY_HINT}
          >
            {events ? <EventsTab events={events} /> : null}
          </AsyncState>
        </TabsContent>
      </Tabs>
    </div>
  )
}
