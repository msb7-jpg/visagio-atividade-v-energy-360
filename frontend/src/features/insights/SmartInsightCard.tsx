import { ChevronDown, RotateCw, Sparkles } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useProactiveInsights } from '@/features/insights/queries/useProactiveInsights'
import { cn } from '@/lib/utils'

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
    // Falha silenciosa para ambientes restritos ou sem acesso a storage
  }
  return true
}

function setStoredCollapsed(storageKey: string, collapsed: boolean): void {
  try {
    localStorage.setItem(storageKey, String(collapsed))
  } catch {
    // Falha silenciosa
  }
}

function InsightLabel() {
  return (
    <span className="text-muted-foreground flex shrink-0 items-center gap-1.5 text-xs font-medium">
      <Sparkles aria-hidden="true" className="size-3.5" />
      Resumo da IA
    </span>
  )
}

function InsightShell({ children, className }: { children: ReactNode, className?: string }) {
  return (
    <Card role="region" aria-label="Resumo da IA" className={cn('px-4 py-3', className)}>
      {children}
    </Card>
  )
}

/**
 * Resumo gerado pela IA a partir das métricas da tela, sem o usuário precisar perguntar.
 * Começa recolhido em uma linha; "Ver detalhes" mostra os pontos de apoio.
 *
 * @param props - Contexto da tela, filtros e métricas ativas.
 * @returns Cartão com o resumo e os pontos de apoio, ou nada se o resumo não estiver disponível.
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
      <InsightShell className="flex items-center gap-3">
        <InsightLabel />
        <span className="text-muted-foreground animate-pulse text-sm">Gerando resumo…</span>
      </InsightShell>
    )
  }

  if (!data?.resumo_executivo) return null

  const hasDetails = data.insights.length > 0

  return (
    <InsightShell>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-3">
          <InsightLabel />
          <p className={cn('text-foreground text-sm', isCollapsed ? 'truncate' : null)}>{data.resumo_executivo}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {hasDetails ? (
            <Button variant="ghost" size="sm" onClick={toggleCollapsed} aria-expanded={!isCollapsed}>
              {isCollapsed ? 'Ver detalhes' : 'Ocultar'}
              <ChevronDown aria-hidden="true" className={cn('transition-transform', isCollapsed ? null : 'rotate-180')} />
            </Button>
          ) : null}
          <Button
            variant="ghost"
            size="icon"
            disabled={isFetching}
            title="Gerar o resumo de novo"
            aria-label="Gerar o resumo de novo"
            onClick={() => {
              void refetch()
            }}
          >
            <RotateCw className={cn(isFetching ? 'animate-spin' : null)} />
          </Button>
        </div>
      </div>

      {!isCollapsed && hasDetails ? (
        <ul className="text-muted-foreground mt-2 flex list-disc flex-col gap-1 pl-5 text-sm">
          {data.insights.map(insightText => (
            <li key={insightText}>{insightText}</li>
          ))}
        </ul>
      ) : null}
    </InsightShell>
  )
}
