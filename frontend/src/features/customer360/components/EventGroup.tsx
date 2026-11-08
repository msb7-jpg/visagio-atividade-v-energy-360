import type { ReactNode } from 'react'
import { HelpCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tooltip } from '@/components/ui/tooltip-card'

interface EventGroupProps {
  title: string
  /** Quem é o dono do dado: a própria unidade ou a região. */
  scope: string
  icon: ReactNode
  /** Quantidade mostrada no selo ao lado do título. */
  count: string
  /** Explicação longa (fórmula, critério), mostrada só no ícone de ajuda. */
  hint?: string
  children: ReactNode
}

/**
 * Sub-bloco do bloco "Falta de luz e chamados": contorno próprio, ícone, título, contagem e a quem o dado pertence.
 *
 * @param props - Textos do cabeçalho e o conteúdo da lista.
 * @returns Cartão plano com cabeçalho e conteúdo.
 */
export function EventGroup({ title, scope, icon, count, hint, children }: EventGroupProps) {
  return (
    <Card className="flex min-w-0 flex-col gap-3 p-4">
      <header className="border-border flex flex-col gap-1 border-b pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <span aria-hidden="true" className="text-muted-foreground">{icon}</span>
          <h3 className="text-foreground text-sm font-semibold">{title}</h3>
          <Badge variant="secondary">{count}</Badge>
          {hint ? (
            <Tooltip content={hint}>
              <Button type="button" variant="inline" size="inline">
                <HelpCircle className="size-3.5" aria-hidden="true" />
                <span className="sr-only">{hint}</span>
              </Button>
            </Tooltip>
          ) : null}
        </div>
        <p className="text-muted-foreground text-xs">{scope}</p>
      </header>
      {children}
    </Card>
  )
}
