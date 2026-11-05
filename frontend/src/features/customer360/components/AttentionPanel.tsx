import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { LoadingSkeleton } from '@/components/feedback/LoadingSkeleton'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { AttentionItem } from '@/features/customer360/utils/attentionItems'

interface AttentionPanelProps {
  items: AttentionItem[]
  isLoading: boolean
}

function AttentionList({ items }: { items: AttentionItem[] }) {
  return (
    <ul aria-label="Pontos de atenção da UC" className="flex flex-col gap-2">
      {items.map((item) => (
        <li key={item.key} className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <Badge variant={item.tone}>{item.label}</Badge>
          <span className="text-muted-foreground text-sm">{item.detail}</span>
        </li>
      ))}
    </ul>
  )
}

function AttentionBody({ items, isLoading }: AttentionPanelProps) {
  if (isLoading) {
    return <LoadingSkeleton count={2} className="h-5" />
  }
  if (items.length === 0) {
    return (
      <p className="text-foreground flex items-center gap-2 text-sm">
        <CheckCircle2 className="text-success size-4" aria-hidden="true" />
        Nada pendente: sem faturas em aberto, sem chamados abertos e região dentro do normal.
      </p>
    )
  }
  return <AttentionList items={items} />
}

/**
 * Bloco crítico no topo da Visão 360: o que o atendente precisa tratar na ligação, com a cor do estado
 * (vermelho para atrasado, laranja para pedir atenção).
 *
 * @param props - Alertas já ordenados (urgentes primeiro) e se os dados ainda estão carregando.
 * @returns Card "Precisa de atenção" com os alertas ou a confirmação de que não há pendências.
 */
export function AttentionPanel({ items, isLoading }: AttentionPanelProps) {
  const hasUrgent = items.some((item) => item.tone === 'destructive')
  return (
    <Card variant="glass" role="region" aria-labelledby="atencao-titulo">
      <CardHeader className="flex flex-row items-center gap-2 pb-2">
        <AlertTriangle className={hasUrgent ? 'text-destructive size-5' : 'text-warning size-5'} aria-hidden="true" />
        <CardTitle id="atencao-titulo">Precisa de atenção</CardTitle>
        {items.length > 0 ? <Badge variant={hasUrgent ? 'destructive' : 'warning'}>{items.length}</Badge> : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <AttentionBody items={items} isLoading={isLoading} />
      </CardContent>
    </Card>
  )
}
