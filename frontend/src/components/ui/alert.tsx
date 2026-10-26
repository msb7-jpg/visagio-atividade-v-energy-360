import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/**
 * Variantes de estilo para o componente Alert do Design System.
 */
const alertVariants = cva(
  'relative flex w-full items-start gap-3 rounded-xl border p-4 text-sm',
  {
    variants: {
      variant: {
        default: 'border-border bg-accent text-accent-foreground',
        warning: 'border-warning/50 bg-warning/10 text-warning',
        destructive: 'border-destructive/50 bg-destructive/10 text-destructive'
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
)

/**
 * Propriedades do componente Alert.
 */
export interface AlertProps
  extends React.ComponentProps<'div'>,
  VariantProps<typeof alertVariants> {}

/**
 * Aviso em destaque que não bloqueia o conteúdo da tela.
 * Usa `role="status"` (anúncio educado); só a variante `destructive` usa `role="alert"` (assertivo).
 *
 * @param props - Propriedades de div nativas e variante visual.
 * @returns Elemento Alert renderizado.
 */
function Alert({ className, variant, ...props }: AlertProps) {
  const role = variant === 'destructive' ? 'alert' : 'status'
  return <div role={role} className={cn(alertVariants({ variant }), className)} {...props} />
}

/**
 * Título do Alert.
 *
 * @param props - Propriedades de div nativas.
 * @returns Elemento AlertTitle renderizado.
 */
function AlertTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('font-semibold leading-none', className)} {...props} />
}

/**
 * Descrição do Alert.
 *
 * @param props - Propriedades de div nativas.
 * @returns Elemento AlertDescription renderizado.
 */
function AlertDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('mt-1 text-sm opacity-90', className)} {...props} />
}

export { Alert, AlertTitle, AlertDescription, alertVariants }
