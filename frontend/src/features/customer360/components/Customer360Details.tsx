import { AttentionPanel } from '@/features/customer360/components/AttentionPanel'
import { SectionNav } from '@/features/customer360/components/SectionNav'
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
 * Ficha da UC: faixa do topo com a identificação e o que precisa de atenção, resumo da IA, atalhos para os blocos e
 * os blocos numerados (consumo, contas, falta de luz e chamados, inspeções), todos visíveis (issue #66).
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
    <div className="flex flex-col gap-6">
      <div className="bg-card border-border grid grid-cols-1 gap-6 rounded-md border p-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CustomerOverviewCard summary={summary} />
        </div>
        <div className="border-border lg:border-l lg:pl-6">
          <AttentionPanel items={buildAttentionItems(history.data, events.data)} isLoading={isAttentionLoading} />
        </div>
      </div>
      {history.data && events.data ? (
        <SmartInsightCard
          context="customer360"
          filters={{ id_uc: summary.id_uc }}
          metrics={buildCustomerInsightMetrics(history.data, events.data, solar)}
        />
      ) : null}
      <SectionNav />
      <ConsumptionSection history={history} />
      <FinancialSection history={history} solar={solar} />
      <TechnicalSection events={events} />
      <InspectionsSection events={events} />
    </div>
  )
}
