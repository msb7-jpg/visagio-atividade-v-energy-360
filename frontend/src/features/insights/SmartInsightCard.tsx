import { RotateCw, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useProactiveInsights } from '@/features/insights/queries/useProactiveInsights'

interface SmartInsightCardProps {
  context: 'customer360' | 'revenue' | 'losses' | 'quality' | 'executive'
  filters?: Record<string, string | number | null>
  metrics?: Record<string, string | number>
}

/**
 * Card de IA contextual e proativo ("thought you might wanna know this...").
 * Se o provedor de IA estiver indisponível ou ocorrer erro, o card não se renderiza
 * para evitar poluir a interface do usuário.
 *
 * @param props - Contexto da tela, filtros e métricas ativas.
 * @returns Componente Card exibindo síntese e lista de insights, ou null se indisponível.
 */
export function SmartInsightCard({ context, filters, metrics }: SmartInsightCardProps) {
  const { data, isLoading, isError, refetch, isFetching } = useProactiveInsights({
    context,
    filtros: filters,
    metricas: metrics
  })

  // Se houver erro ou o serviço de IA estiver indisponível (ex: 503), não polui a UI
  if (isError) {
    return null
  }

  // Durante o carregamento inicial proativo
  if (isLoading) {
    return (
      <Card variant="glass" className="my-4">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="size-4 animate-pulse" />
            </div>
            <CardTitle>Smart Insights IA</CardTitle>
            <Badge variant="secondary">{context.toUpperCase()}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            <div className="h-4 w-3/4 animate-pulse rounded bg-muted/60" />
            <div className="h-3 w-5/6 animate-pulse rounded bg-muted/40" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-muted/40" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data || !data.resumo_executivo) {
    return null
  }

  return (
    <Card variant="glass" className="my-4">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Sparkles className="size-4" />
          </div>
          <CardTitle>Smart Insights IA</CardTitle>
          <Badge variant="secondary">{context.toUpperCase()}</Badge>
        </div>
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
