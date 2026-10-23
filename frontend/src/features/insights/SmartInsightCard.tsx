import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface SmartInsightCardProps {
  context: 'customer360' | 'revenue' | 'losses' | 'quality'
  filters?: Record<string, string | number | null>
  metrics?: Record<string, string | number>
}

/**
 * Card de IA contextual embutido nas telas operacionais e analíticas.
 *
 * @param props - Contexto da tela, filtros e métricas ativas.
 * @returns Componente Card exibindo síntese e lista de insights.
 */
export function SmartInsightCard({ context, filters, metrics }: SmartInsightCardProps) {
  const [insights, setInsights] = useState<string[]>([])
  const [summary, setSummary] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const fetchInsights = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('auth_token')
      const headers: HeadersInit = { 'Content-Type': 'application/json' }
      if (token) headers.Authorization = `Bearer ${token}`

      const res = await fetch('/api/v1/agent/insights', {
        method: 'POST',
        headers,
        body: JSON.stringify({ context, filtros: filters || {}, metricas: metrics || {} })
      })

      if (res.ok) {
        const data = await res.json()
        setInsights(data.insights || [])
        setSummary(data.resumo_executivo || null)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card variant="glass" className="my-4">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <CardTitle>Smart Insights IA</CardTitle>
          <Badge variant="secondary">
            {context.toUpperCase()}
          </Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={isLoading}
          onClick={fetchInsights}
        >
          {isLoading ? 'Analisando...' : 'Gerar Insights'}
        </Button>
      </CardHeader>

      <CardContent>
        {summary ? <p className="text-xs font-medium text-foreground mb-2">{summary}</p> : null}

        {insights.length > 0 ? (
          <ul className="list-disc pl-4 space-y-1 text-xs text-muted-foreground">
            {insights.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground">
            Clique em &quot;Gerar Insights&quot; para acionar a análise contextual proativa deste painel.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
