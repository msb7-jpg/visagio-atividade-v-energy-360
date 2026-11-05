import { cn } from '@/lib/utils'
import { Tabs as TabsPrimitive } from '@base-ui/react/tabs'
import * as React from 'react'

/** `segmented` é o seletor em pílula das abas principais; `line` é o sublinhado das abas de segundo nível. */
type TabsVariant = 'segmented' | 'line'

const TabsVariantContext = React.createContext<TabsVariant>('segmented')

const LIST_CLASSES: Record<TabsVariant, string> = {
  segmented: 'inline-flex h-9 w-fit items-center justify-start gap-0.5 rounded-md border border-border bg-muted p-0.5 text-muted-foreground',
  line: 'inline-flex w-full items-center justify-start gap-5 border-b border-border text-muted-foreground'
}

const TRIGGER_BASE_CLASSES =
  'inline-flex items-center justify-center gap-1.5 whitespace-nowrap font-medium ring-offset-background transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer'

const TRIGGER_CLASSES: Record<TabsVariant, string> = {
  segmented:
    'h-full rounded-sm px-3 text-sm hover:text-foreground data-[active]:bg-card data-[active]:text-foreground data-[active]:shadow-sm',
  line: '-mb-px border-b-2 border-transparent px-0.5 pb-2.5 pt-1 text-sm hover:text-foreground data-[active]:border-foreground data-[active]:text-foreground'
}

interface TabsProps extends TabsPrimitive.Root.Props {
  variant?: TabsVariant
}

/** Componente raiz de gerenciamento de estado e contexto de abas. */
function Tabs({ className, variant = 'segmented', ...props }: TabsProps): React.JSX.Element {
  return (
    <TabsVariantContext value={variant}>
      <TabsPrimitive.Root
        data-slot="tabs"
        className={cn('flex flex-col gap-2', className)}
        {...props}
      />
    </TabsVariantContext>
  )
}

/** Container horizontal que abriga os seletores de abas; o visual segue a variante do `Tabs`. */
function TabsList({ className, ...props }: TabsPrimitive.List.Props): React.JSX.Element {
  const variant = React.useContext(TabsVariantContext)
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(LIST_CLASSES[variant], className)}
      {...props}
    />
  )
}

/** Botão seletor de aba individual com estado ativo destacado; o visual segue a variante do `Tabs`. */
function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props): React.JSX.Element {
  const variant = React.useContext(TabsVariantContext)
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(TRIGGER_BASE_CLASSES, TRIGGER_CLASSES[variant], className)}
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
