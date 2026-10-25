import type { ReactNode } from 'react'
import { Card } from '@/components/ui/card'

interface SummaryCardProps {
  title: ReactNode
  /** Link ou ajuda ao lado do título (ex.: "como calculamos"). */
  action?: ReactNode
  children: ReactNode
}

/**
 * Moldura comum dos cartões do topo da Fila de Inspeção: título, ação opcional e conteúdo.
 *
 * @param props - Título, ação ao lado do título e corpo do cartão.
 * @returns Cartão analítico com a variante `interactive` do design system.
 */
export function SummaryCard({ title, action, children }: SummaryCardProps) {
  return (
    <Card variant="interactive" className="flex flex-col gap-2 p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-muted-foreground text-sm font-semibold">{title}</h3>
        {action}
      </div>
      {children}
    </Card>
  )
}
