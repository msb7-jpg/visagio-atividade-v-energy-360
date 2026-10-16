import { cn } from '@/lib/utils'
import * as React from 'react'

/**
 * Propriedades para estilização do componente Label.
 */
export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  /** Se `true`, indica visualmente obrigatoriedade com asterisco vermelho. */
  required?: boolean
}

/**
 * Rótulo semântico e acessível para campos de formulário (design.md).
 *
 * @param props - Propriedades nativas de label HTML e indicador de obrigatoriedade.
 * @returns Elemento label renderizado.
 */
export function Label({
  className,
  required = false,
  children,
  ...props
}: LabelProps): React.JSX.Element {
  return (
    <label
      className={cn(
        'text-xs font-semibold leading-none text-muted-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        className
      )}
      {...props}
    >
      {children}
      {required ? <span className="text-destructive ml-1">*</span> : null}
    </label>
  )
}
