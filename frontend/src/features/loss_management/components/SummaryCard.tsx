import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tooltip } from '@/components/ui/tooltip-card'

interface SummaryCardProps {
  title: ReactNode
  /** Explicação que abre ao passar o mouse, focar ou tocar em "como calculamos"; sem ela, o link não aparece. */
  hint?: ReactNode
  children: ReactNode
}

/**
 * Moldura compacta dos cartões do topo da Fila de Inspeção: título, explicação opcional em tooltip e conteúdo.
 *
 * @param props - Título, explicação do cálculo e corpo do cartão.
 * @returns Cartão analítico com a variante `interactive` do design system.
 */
export function SummaryCard({ title, hint, children }: SummaryCardProps) {
  return (
    <Card variant="interactive" className="flex flex-col gap-1 p-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-muted-foreground text-sm font-semibold">{title}</h3>
        {hint ? (
          <Tooltip content={hint}>
            <Button type="button" variant="link" size="sm">como calculamos</Button>
          </Tooltip>
        ) : null}
      </div>
      {children}
    </Card>
  )
}
