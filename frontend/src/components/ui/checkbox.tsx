import * as React from 'react'
import { Check, Minus } from 'lucide-react'
import { Checkbox as CheckboxPrimitive } from 'radix-ui'
import { cn } from '@/lib/utils'

/**
 * Caixa de seleção padronizada do design system (Radix UI), acessível por teclado e com estado desabilitado.
 * Use no lugar de `<input type="checkbox">`, que é proibido fora de `components/ui/`.
 *
 * @param props - Propriedades do Radix Checkbox (`checked`, `onCheckedChange`, `disabled`, `aria-label`).
 * @returns Caixa de seleção renderizada.
 */
export function Checkbox({ className, ...props }: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        'group border-input bg-background focus-visible:ring-ring data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=checked]:border-primary data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground data-[state=indeterminate]:border-primary peer flex size-4 shrink-0 cursor-pointer items-center justify-center rounded border shadow-sm transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator>
        <Check className="size-3 group-data-[state=indeterminate]:hidden" aria-hidden="true" />
        <Minus className="hidden size-3 group-data-[state=indeterminate]:block" aria-hidden="true" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}
