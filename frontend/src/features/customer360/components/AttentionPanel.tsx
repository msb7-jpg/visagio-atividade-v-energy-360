import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { LoadingSkeleton } from '@/components/feedback/LoadingSkeleton'
import { Badge } from '@/components/ui/badge'
import type { AttentionItem } from '@/features/customer360/utils/attentionItems'

interface AttentionPanelProps {
  items: AttentionItem[]
  isLoading: boolean
}

function AttentionList({ items }: { items: AttentionItem[] }) {
  return (
    <ul aria-label="Pontos de atenção da UC" className="flex flex-col gap-3">
      {items.map((item) => (
        <li key={item.key} className="flex flex-col items-start gap-1">
          <Badge variant={item.tone}>{item.label}</Badge>
          <span className="text-muted-foreground text-xs">{item.detail}</span>
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
 * @returns Bloco "Precisa de atenção" com os alertas ou a confirmação de que não há pendências.
 */
export function AttentionPanel({ items, isLoading }: AttentionPanelProps) {
  const hasUrgent = items.some((item) => item.tone === 'destructive')
  return (
    <section role="region" aria-labelledby="atencao-titulo" className="flex min-w-0 flex-col gap-3">
      <div className="flex items-center gap-2">
        <AlertTriangle className={hasUrgent ? 'text-destructive size-4' : 'text-warning size-4'} aria-hidden="true" />
        <h2 id="atencao-titulo" className="text-foreground text-sm font-semibold">Precisa de atenção</h2>
        {items.length > 0 ? <Badge variant={hasUrgent ? 'destructive' : 'warning'}>{items.length}</Badge> : null}
      </div>
      <AttentionBody items={items} isLoading={isLoading} />
    </section>
  )
}
