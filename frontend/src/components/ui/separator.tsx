import { cn } from '@/lib/utils'
import * as React from 'react'

/**
 * Propriedades para estilização e orientação do Separator.
 */
export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Orientação física do separador.
   * @defaultValue `'horizontal'`
   */
  orientation?: 'horizontal' | 'vertical'
  /**
   * Indica se o separador é puramente decorativo para tecnologias assistivas.
   * @defaultValue `true`
   */
  decorative?: boolean
}

/**
 * Separador semântico horizontal ou vertical entre blocos de conteúdo (design.md).
 *
 * @param props - Propriedades de orientação e estilo.
 * @returns Elemento JSX do separador renderizado.
 */
export function Separator({
  className,
  orientation = 'horizontal',
  decorative = true,
  ...props
}: SeparatorProps): React.JSX.Element {
  return (
    <div
      role={decorative ? 'none' : 'separator'}
      aria-orientation={decorative ? undefined : orientation}
      className={cn(
        'shrink-0 bg-border',
        orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
        className
      )}
      {...props}
    />
  )
}
