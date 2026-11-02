import { AttentionPanel } from '@/features/customer360/components/AttentionPanel'
import { ConsumptionSection, FinancialSection, TechnicalSection } from '@/features/customer360/components/Customer360Sections'
import { useCustomerEventsQuery, useCustomerHistoryQuery } from '@/features/customer360/hooks/useCustomer360Queries'
import type { CustomerSummary } from '@/features/customer360/types/customer360Types'
import { buildAttentionItems } from '@/features/customer360/utils/attentionItems'
import { buildCustomerInsightMetrics } from '@/features/customer360/utils/insightMetrics'
import { SmartInsightCard } from '@/features/insights/SmartInsightCard'

/**
 * Ficha da UC em blocos, do mais urgente para o detalhe: "Precisa de atenção", insight de IA, "Cliente e consumo",
 * "Histórico financeiro" e "Problemas técnicos" (issue #66).
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
      <div className="flex flex-col gap-4">
        <AttentionPanel items={buildAttentionItems(history.data, events.data)} isLoading={isAttentionLoading} />
        {history.data && events.data ? (
          <SmartInsightCard
            context="customer360"
            filters={{ id_uc: summary.id_uc }}
            metrics={buildCustomerInsightMetrics(history.data, events.data, solar)}
          />
        ) : null}
      </div>
      <ConsumptionSection summary={summary} history={history} events={events} />
      <FinancialSection history={history} solar={solar} />
      <TechnicalSection events={events} />
    </div>
  )
}
