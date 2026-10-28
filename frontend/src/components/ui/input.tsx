import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const inputVariants = cva(
  'flex h-10 w-full rounded-xl border border-input bg-background px-3.5 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
  {
    variants: {
      variant: {
        default: '',
        embedded: 'h-9 border-0 bg-transparent px-2 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0'
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
)

export interface InputProps
  extends React.ComponentProps<'input'>,
  VariantProps<typeof inputVariants> {}

/**
 * Campo de entrada Input padronizado conforme design.md (SaaS Enterprise Analytics).
 * Possui raio de 12px (rounded-xl), borda de 1px e anel de foco proeminente com deslocamento.
 *
 * @param props - Propriedades nativas de input HTML e variantes de exibição.
 * @returns Elemento input renderizado.
 */
function Input({ className, type, variant, ...props }: InputProps) {
  return (
    <input
      type={type}
      className={cn(inputVariants({ variant, className }))}
      {...props}
    />
  )
}

export { Input, inputVariants }
