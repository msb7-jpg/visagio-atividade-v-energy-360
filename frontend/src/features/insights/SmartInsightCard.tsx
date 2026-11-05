import { useState } from 'react'
import { InsightActions } from '@/features/insights/components/InsightActions'
import { InsightBody } from '@/features/insights/components/InsightBody'
import { InsightShell } from '@/features/insights/components/InsightShell'
import { useProactiveInsights } from '@/features/insights/queries/useProactiveInsights'

interface SmartInsightCardProps {
  context: 'customer360' | 'revenue' | 'losses' | 'quality' | 'executive'
  filters?: Record<string, string | number | null>
  metrics?: Record<string, string | number>
}

function getInitialCollapsed(storageKey: string): boolean {
  try {
    const saved = localStorage.getItem(storageKey)
    if (saved !== null) {
      return saved === 'true'
    }
  } catch {
    return true
  }
  return true
}

function setStoredCollapsed(storageKey: string, collapsed: boolean): void {
  try {
    localStorage.setItem(storageKey, String(collapsed))
  } catch {
    return
  }
}

/**
 * Resumo da IA no topo da tela: a resposta em uma frase, o próximo passo e os números que a sustentam, para o
 * usuário não precisar percorrer a tela. "Ver detalhes" mostra os pontos de apoio.
 *
 * @param props - Contexto da tela, filtros e métricas ativas.
 * @returns Bloco em destaque com o resumo, ou nada se o resumo não estiver disponível.
 */
export function SmartInsightCard({ context, filters, metrics }: SmartInsightCardProps) {
  const storageKey = `venergy_insight_collapsed_${context}`
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => getInitialCollapsed(storageKey))

  const { data, isLoading, isError, refetch, isFetching } = useProactiveInsights({
    context,
    filtros: filters,
    metricas: metrics
  })

  const toggleCollapsed = () => {
    const nextState = !isCollapsed
    setIsCollapsed(nextState)
    setStoredCollapsed(storageKey, nextState)
  }

  if (isError) return null

  if (isLoading) {
    return (
      <InsightShell>
        <p className="text-muted-foreground animate-pulse text-sm">Gerando resumo…</p>
      </InsightShell>
    )
  }

  if (!data?.resumo_executivo) return null

  const hasDetails = data.insights.length > 0

  return (
    <InsightShell
      tone={data.tom}
      actions={(
        <InsightActions
          hasDetails={hasDetails}
          isCollapsed={isCollapsed}
          isFetching={isFetching}
          onToggle={toggleCollapsed}
          onRefresh={() => void refetch()}
        />
      )}
    >
      <InsightBody data={data} />
      {!isCollapsed && hasDetails ? (
        <ul className="border-primary/15 text-foreground flex list-disc flex-col gap-1.5 border-t pt-3 pl-5 text-sm">
          {data.insights.map(insightText => (
            <li key={insightText}>{insightText}</li>
          ))}
        </ul>
      ) : null}
    </InsightShell>
  )
}
