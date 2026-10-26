import * as React from 'react'
import { Command as CommandPrimitive } from 'cmdk'
import { cn } from '@/lib/utils'

/**
 * Raiz da busca com sugestões navegáveis por teclado, no padrão do Command do shadcn/ui sobre `cmdk`.
 *
 * @param props - Propriedades do `cmdk` (ex: `shouldFilter={false}` para filtrar no servidor).
 * @returns Container da busca.
 */
function Command({ className, ...props }: React.ComponentProps<typeof CommandPrimitive>) {
  return <CommandPrimitive className={cn('relative flex w-full flex-col', className)} {...props} />
}

/**
 * Campo de texto da busca, com o mesmo visual do `Input` do design system.
 *
 * @param props - Propriedades do input do `cmdk` (`value` e `onValueChange`).
 * @returns Campo de busca.
 */
function CommandInput({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <CommandPrimitive.Input
      className={cn(
        'flex h-10 w-full rounded-xl border border-input bg-background px-3.5 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  )
}

/**
 * Lista flutuante de sugestões abaixo do campo.
 *
 * @param props - Propriedades da lista do `cmdk`.
 * @returns Caixa de sugestões com rolagem.
 */
function CommandList({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      className={cn(
        'border-border bg-popover text-popover-foreground absolute top-full right-0 left-0 z-50 mt-1 max-h-80 overflow-y-auto rounded-xl border p-1 shadow-xl',
        className
      )}
      {...props}
    />
  )
}

/**
 * Mensagem exibida quando nenhuma sugestão corresponde ao texto.
 *
 * @param props - Propriedades do estado vazio do `cmdk`.
 * @returns Texto de lista vazia.
 */
function CommandEmpty({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  return <CommandPrimitive.Empty className={cn('text-muted-foreground px-3 py-4 text-center text-sm', className)} {...props} />
}

/**
 * Item de sugestão selecionável com mouse ou teclado.
 *
 * @param props - Propriedades do item do `cmdk` (`value` e `onSelect`).
 * @returns Linha da lista com destaque ao navegar.
 */
function CommandItem({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      className={cn(
        'flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm outline-none aria-selected:bg-muted aria-disabled:pointer-events-none aria-disabled:opacity-50',
        className
      )}
      {...props}
    />
  )
}

export { Command, CommandEmpty, CommandInput, CommandItem, CommandList }
