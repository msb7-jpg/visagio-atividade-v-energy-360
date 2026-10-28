import { cn } from '@/lib/utils'
import * as React from 'react'

/**
 * Propriedades para estilização e feedback visual do componente Select.
 */
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  /**
   * Se `true`, destaca as bordas com a cor semântica de erro/atenção destrutiva.
   * @defaultValue `false`
   */
  error?: boolean
}

/**
 * Dropdown de seleção nativo padronizado do design system (design.md).
 * Possui raio de 12px (rounded-md), anel de foco duplo com offset e estado de erro semântico.
 *
 * @param props - Propriedades de estilo, erro e elementos option filhos.
 * @returns Elemento JSX do select renderizado.
 */
export function Select({
  className,
  error = false,
  ref,
  children,
  ...props
}: SelectProps & { ref?: React.Ref<HTMLSelectElement> }): React.JSX.Element {
  return (
    <select
      ref={ref}
      className={cn(
        'flex h-10 w-full rounded-md border bg-background px-3 py-2 text-base text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer',
        error ? 'border-destructive focus-visible:ring-destructive' : 'border-input',
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
}
