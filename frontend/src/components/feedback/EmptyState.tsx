import type { ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  title: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
  className?: string
}

/**
 * Estado vazio padronizado para feedback de ausência de dados (design.md).
 * Composição baseada em ícone central, título claro, descrição e ação contextual.
 *
 * @param props - Propriedades do estado vazio.
 * @returns Elemento EmptyState renderizado.
 */
export function EmptyState({
  title,
  description,
  icon,
  action,
  className
}: EmptyStateProps) {
  const renderedIcon = icon ?? <AlertCircle className="size-10" />

  return (
    <div
      className={cn(
        'border-border flex flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center bg-card/50',
        className
      )}
    >
      <div className="text-muted-foreground mb-3">
        {renderedIcon}
      </div>
      <h3 className="text-foreground text-base font-semibold">{title}</h3>
      {description ? (
        <p className="text-muted-foreground mt-1.5 max-w-sm text-sm">{description}</p>
      ) : null}
      {action ? (
        <div className="mt-4">{action}</div>
      ) : null}
    </div>
  )
}
