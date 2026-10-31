import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const inputVariants = cva(
  'flex h-10 w-full rounded-md border bg-background/70 px-3.5 py-2 text-base shadow-sm transition duration-150 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:border-primary/60 disabled:cursor-not-allowed disabled:opacity-50 md:text-base',
  {
    variants: {
      variant: {
        default: 'border-input hover:border-input/80',
        embedded: 'h-9 border-0 bg-transparent px-2 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0'
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
)

/**
 * Propriedades do Input: as nativas de input HTML, variantes visuais e estado de erro.
 */
export interface InputProps
  extends React.ComponentProps<'input'>,
  VariantProps<typeof inputVariants> {
  /**
   * Se `true`, destaca a borda e o foco com a cor semântica destrutiva (mesmo contrato do `Select`).
   * @defaultValue `false`
   */
  error?: boolean
}

/**
 * Campo de entrada Input padronizado conforme design.md (SaaS Enterprise Analytics).
 * Possui raio base (rounded-md), borda de 1px e anel de foco proeminente com deslocamento.
 *
 * @param props - Propriedades nativas de input HTML, variante e estado de erro.
 * @returns Elemento input renderizado.
 */
function Input({ className, type, variant, error = false, ...props }: InputProps) {
  const errorClasses = error ? 'border-destructive focus-visible:ring-destructive' : ''

  return (
    <input
      type={type}
      className={cn(
        inputVariants({ variant }),
        errorClasses,
        className
      )}
      {...props}
    />
  )
}

export { Input, inputVariants }
