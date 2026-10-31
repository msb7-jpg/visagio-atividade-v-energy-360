import { cn } from '@/lib/utils'
import { DropdownMenu as DropdownMenuPrimitive } from 'radix-ui'
import * as React from 'react'

/** Raiz do menu suspenso (shadcn/Radix): controla abertura, foco e teclado. */
function DropdownMenu({ ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Root>): React.JSX.Element {
  return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />
}

/** Elemento que abre o menu; use `asChild` para reaproveitar o `Button`. */
function DropdownMenuTrigger({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>): React.JSX.Element {
  return <DropdownMenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props} />
}

/**
 * Painel do menu: 300 px no computador, nunca maior que a tela e com rolagem interna se faltar altura.
 * A entrada e a saída são animadas por `.dropdown-menu-anim` (index.css).
 */
function DropdownMenuContent({
  className,
  sideOffset = 8,
  collisionPadding = 16,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content>): React.JSX.Element {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        data-slot="dropdown-menu-content"
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        className={cn(
          'dropdown-menu-anim z-50 w-75 max-w-(--radix-dropdown-menu-content-available-width) max-h-(--radix-dropdown-menu-content-available-height) origin-(--radix-dropdown-menu-content-transform-origin) overflow-y-auto rounded-lg border border-border bg-card p-1 text-foreground shadow-2xl',
          className
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  )
}

/** Item acionável com alvo de toque de 44 px e fundo `muted` ao passar o mouse ou focar. */
function DropdownMenuItem({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item>): React.JSX.Element {
  return (
    <DropdownMenuPrimitive.Item
      data-slot="dropdown-menu-item"
      className={cn(
        'flex min-h-11 cursor-default select-none items-center gap-2 rounded-md px-3 py-2 text-base outline-none transition-colors duration-100 motion-reduce:transition-none data-highlighted:bg-muted data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
        className
      )}
      {...props}
    />
  )
}

/** Bloco de texto não clicável (cabeçalho do menu). */
function DropdownMenuLabel({ className, ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Label>): React.JSX.Element {
  return <DropdownMenuPrimitive.Label data-slot="dropdown-menu-label" className={cn('px-3 py-2', className)} {...props} />
}

/** Linha divisória entre grupos de itens. */
function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>): React.JSX.Element {
  return (
    <DropdownMenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn('bg-border -mx-1 my-1 h-px', className)}
      {...props}
    />
  )
}

export {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
}
