import { cn } from '@/lib/utils'
import { Popover as PopoverPrimitive } from 'radix-ui'
import * as React from 'react'

/** Raiz do popover (shadcn/Radix): controla abertura, foco e teclado. */
function Popover({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Root>): React.JSX.Element {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />
}

/** Elemento que abre o popover; use `asChild` para reaproveitar o `Button`. */
function PopoverTrigger({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Trigger>): React.JSX.Element {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />
}

/**
 * Painel do popover: 320 px no computador, nunca maior que a tela e com rolagem interna se faltar altura.
 * A entrada e a saída são animadas por `.dropdown-menu-anim` (index.css), a mesma do menu do usuário.
 */
function PopoverContent({
  className,
  align = 'start',
  sideOffset = 8,
  collisionPadding = 16,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>): React.JSX.Element {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        data-slot="popover-content"
        align={align}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        className={cn(
          'dropdown-menu-anim z-50 w-80 max-w-(--radix-popover-content-available-width) max-h-(--radix-popover-content-available-height) origin-(--radix-popover-content-transform-origin) overflow-y-auto rounded-lg border border-border bg-card p-4 text-foreground shadow-2xl outline-none',
          className
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
}

export { Popover, PopoverContent, PopoverTrigger }
