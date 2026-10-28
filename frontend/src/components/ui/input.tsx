import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Propriedades do Input: as nativas de input HTML mais o estado de erro.
 */
export interface InputProps extends React.ComponentProps<'input'> {
  /**
   * Se `true`, destaca a borda e o foco com a cor semântica destrutiva (mesmo contrato do `Select`).
   * @defaultValue `false`
   */
  error?: boolean
}

/**
 * Campo de entrada Input padronizado conforme design.md (SaaS Enterprise Analytics).
 * Possui raio de 12px (rounded-md), borda de 1px e anel de foco proeminente com deslocamento.
 *
 * @param props - Propriedades nativas de input HTML e estado de erro.
 * @returns Elemento input renderizado.
 */
function Input({ className, type, error = false, ...props }: InputProps) {
  return (
    <input
      type={type}
      className={cn(
        'flex h-10 w-full rounded-md border bg-background px-3.5 py-2 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-base',
        error ? 'border-destructive focus-visible:ring-destructive' : 'border-input focus-visible:ring-ring',
        className
      )}
      {...props}
    />
  )
}

export { Input }
