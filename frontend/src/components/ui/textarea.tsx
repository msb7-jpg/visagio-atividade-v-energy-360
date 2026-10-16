import { cn } from '@/lib/utils'
import * as React from 'react'

/**
 * Propriedades para estilização do campo Textarea.
 */
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Se `true`, destaca a borda com cor destrutiva de erro. */
  error?: boolean
}

/**
 * Campo de texto multilinha padronizado conforme design.md (SaaS Enterprise Analytics).
 * Possui raio de 12px (rounded-xl), borda de 1px e anel de foco proeminente com deslocamento.
 *
 * @param props - Propriedades nativas de textarea HTML.
 * @returns Elemento textarea renderizado.
 */
export function Textarea({
  className,
  error = false,
  ref,
  ...props
}: TextareaProps & { ref?: React.Ref<HTMLTextAreaElement> }): React.JSX.Element {
  return (
    <textarea
      ref={ref}
      className={cn(
        'flex min-h-20 w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        error ? 'border-destructive focus-visible:ring-destructive' : 'border-input',
        className
      )}
      {...props}
    />
  )
}
