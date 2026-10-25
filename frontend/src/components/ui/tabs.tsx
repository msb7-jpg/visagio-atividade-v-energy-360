import { cn } from '@/lib/utils'
import { Tabs as TabsPrimitive } from '@base-ui/react/tabs'
import * as React from 'react'

/** Componente raiz de gerenciamento de estado e contexto de abas. */
function Tabs({ className, ...props }: TabsPrimitive.Root.Props): React.JSX.Element {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn('flex flex-col gap-2', className)}
      {...props}
    />
  )
}

/** Container horizontal com fundo atenuado que abriga os seletores de abas. */
function TabsList({ className, ...props }: TabsPrimitive.List.Props): React.JSX.Element {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        'inline-flex h-10 items-center justify-start rounded-xl bg-muted p-1 text-muted-foreground',
        className
      )}
      {...props}
    />
  )
}

/** Botão seletor de aba individual com estado ativo destacado na cor primária. */
function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props): React.JSX.Element {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3.5 py-1.5 text-xs font-semibold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-primary data-[active]:text-primary-foreground data-[active]:shadow-sm cursor-pointer',
        className
      )}
      {...props}
    />
  )
}

/** Painel de conteúdo associado à aba selecionada. */
function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props): React.JSX.Element {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn(
        'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className
      )}
      {...props}
    />
  )
}

export { Tabs, TabsContent, TabsList, TabsTrigger }
