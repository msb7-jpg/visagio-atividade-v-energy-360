import { ChevronDown, ChevronUp, RotateCw, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

/**
 * Card de IA contextual e proativo ("thought you might wanna know this...").
 * Inicia recolhido por padrão com resumo em linha para preservar espaço visual.
 *
 * @param props - Contexto da tela, filtros e métricas ativas.
 * @returns Componente Card exibindo síntese e lista de insights, ou null se indisponível.
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
      <Card variant="glass" className="my-3 py-2 px-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 animate-pulse text-primary" />
            <span className="text-xs font-semibold text-foreground">Smart Insights IA</span>
            <Badge variant="secondary">{context.toUpperCase()}</Badge>
            <span className="text-xs text-muted-foreground animate-pulse">
              Gerando síntese executiva...
            </span>
          </div>
        </div>
      </Card>
    )
  }

  if (!data || !data.resumo_executivo) return null

  if (isCollapsed) {
    return (
      <Card variant="glass" className="my-3 py-2 px-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="size-3.5" />
            </div>
            <span className="shrink-0 text-xs font-semibold text-foreground">Smart Insights IA</span>
            <Badge variant="secondary" className="shrink-0">{context.toUpperCase()}</Badge>
            <p className="truncate text-xs text-foreground/90">
              {data.resumo_executivo}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleCollapsed}
              title="Expandir síntese de IA"
            >
              <span className="flex items-center gap-1 text-xs">
                <span>Expandir</span>
                <ChevronDown className="size-3.5" />
              </span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              disabled={isFetching}
              title="Atualizar análise da IA"
              onClick={() => {
                void refetch()
              }}
            >
              <RotateCw className={`size-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card variant="glass" className="my-3">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Sparkles className="size-4" />
          </div>
          <CardTitle>Smart Insights IA</CardTitle>
          <Badge variant="secondary">{context.toUpperCase()}</Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleCollapsed}
            title="Minimizar síntese de IA"
          >
            <span className="flex items-center gap-1 text-xs">
              <span>Minimizar</span>
              <ChevronUp className="size-3.5" />
            </span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            disabled={isFetching}
            title="Atualizar análise da IA"
            onClick={() => {
              void refetch()
            }}
          >
            <RotateCw className={`size-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <p className="mb-2 text-xs font-medium text-foreground">
          {data.resumo_executivo}
        </p>

        {data.insights.length > 0 ? (
          <ul className="flex list-disc flex-col gap-1 pl-4 text-xs text-muted-foreground">
            {data.insights.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  )
}
