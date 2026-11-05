import { AttentionPanel } from '@/features/customer360/components/AttentionPanel'
import { CustomerOverviewCard } from '@/features/customer360/components/CustomerOverviewCard'
import {
  ConsumptionSection,
  FinancialSection,
  InspectionsSection,
  TechnicalSection
} from '@/features/customer360/components/Customer360Sections'
import { useCustomerEventsQuery, useCustomerHistoryQuery } from '@/features/customer360/hooks/useCustomer360Queries'
import type { CustomerSummary } from '@/features/customer360/types/customer360Types'
import { buildAttentionItems } from '@/features/customer360/utils/attentionItems'
import { buildCustomerInsightMetrics } from '@/features/customer360/utils/insightMetrics'
import { SmartInsightCard } from '@/features/insights/SmartInsightCard'

/**
 * Ficha da UC: cadastro e resumo da IA no topo; consumo, inspeções e faturas na coluna principal; o que precisa de
 * atenção na lateral fixa; falta de luz e chamados embaixo, na largura toda (issue #66).
 *
 * @param props - Cadastro da UC já encontrada.
 * @returns Blocos da Visão 360, todos visíveis sem trocar de aba.
 */
export function Customer360Details({ summary }: { summary: CustomerSummary }) {
  const historyQuery = useCustomerHistoryQuery(summary.id_uc)
  const eventsQuery = useCustomerEventsQuery(summary.id_uc)
  const solar = { hasSolar: summary.possui_gd, connectedAt: summary.data_conexao_gd }
  const history = { data: historyQuery.data, isError: historyQuery.isError, retry: () => void historyQuery.refetch() }
  const events = { data: eventsQuery.data, isError: eventsQuery.isError, retry: () => void eventsQuery.refetch() }
  const isAttentionLoading = (!history.data && !history.isError) || (!events.data && !events.isError)

  return (
    <div className="flex flex-col gap-8">
      <CustomerOverviewCard summary={summary} />
      {history.data && events.data ? (
        <SmartInsightCard
          context="customer360"
          filters={{ id_uc: summary.id_uc }}
          metrics={buildCustomerInsightMetrics(history.data, events.data, solar)}
        />
      ) : null}
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-8 xl:col-span-2">
          <ConsumptionSection history={history} />
          <InspectionsSection events={events} />
          <FinancialSection history={history} solar={solar} />
        </div>
        <div className="flex min-w-0 flex-col gap-6 xl:sticky xl:top-20 xl:self-start">
          <AttentionPanel items={buildAttentionItems(history.data, events.data)} isLoading={isAttentionLoading} />
        </div>
      </div>
      <TechnicalSection events={events} />
    </div>
  )
}
