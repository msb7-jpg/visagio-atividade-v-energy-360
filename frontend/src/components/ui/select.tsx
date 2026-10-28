import { cn } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'
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
 * Possui raio de 12px (rounded-md), anel de foco duplo com offset, estado de erro semântico e seta própria
 * (a seta nativa do navegador é escondida para ficar igual em todos os navegadores e temas).
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
    <div className="relative w-full">
      <select
        ref={ref}
        className={cn(
          'flex h-10 w-full cursor-pointer appearance-none rounded-md border bg-background py-2 pr-10 pl-3 text-base text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          error ? 'border-destructive focus-visible:ring-destructive' : 'border-input',
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown aria-hidden="true" className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2" />
    </div>
  )
}
