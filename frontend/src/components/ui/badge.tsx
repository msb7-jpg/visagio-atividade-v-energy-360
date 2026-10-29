import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/**
 * Variantes de estilo para o componente Badge do Design System.
 * success, warning e destructive usam o tint de 15% com o texto na própria cor (contraste AA medido em tokens-*.png).
 */
const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground shadow-sm hover:bg-primary/80',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive: 'border-destructive/20 bg-destructive/15 text-destructive',
        warning: 'border-warning/20 bg-warning/15 text-warning',
        success: 'border-success/20 bg-success/15 text-success',
        accent: 'border-transparent bg-accent text-accent-foreground',
        muted: 'border-border bg-muted text-muted-foreground',
        outline: 'border-border text-foreground'
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
)

/**
 * Propriedades do componente Badge.
 */
export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof badgeVariants> {}

/**
 * Componente Badge para exibição de categorias, roles e status.
 *
 * @param props - Propriedades do Badge incluindo variante.
 * @returns Elemento Badge renderizado.
 */
function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
