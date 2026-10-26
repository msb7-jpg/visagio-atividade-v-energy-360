import { ClipboardList, ListOrdered } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { InspectionOrdersTab } from '@/features/loss_management/components/InspectionOrdersTab'
import { SuspiciousQueueTab } from '@/features/loss_management/components/SuspiciousQueueTab'
import { useInspectionsQuery } from '@/features/loss_management/hooks/useLossQueries'
import { useSuspiciousQueueController } from '@/features/loss_management/hooks/useSuspiciousQueueController'
import { formatInteger } from '@/features/loss_management/utils/lossFormatters'

const withCount = (label: string, count: number | undefined) =>
  count === undefined ? label : `${label} (${formatInteger(count)})`

/**
 * Página da Fila de Inspeção: fila priorizada de UCs suspeitas e ordens de inspeção em campo.
 *
 * @returns Página com as abas "Fila priorizada" e "Ordens de inspeção", ambas com contador.
 */
export function LossManagementPage() {
  const queue = useSuspiciousQueueController()
  const { data: orders } = useInspectionsQuery()

  return (
    <div className="bg-background min-h-dvh">
      <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-foreground text-xl font-bold tracking-tight">Fila de Inspeção</h1>
          <p className="text-muted-foreground text-sm">
            Quais UCs mandar a campo primeiro · score = chance de irregularidade × energia recuperável
          </p>
        </div>

        <Tabs defaultValue="suspects">
          <TabsList>
            <TabsTrigger value="suspects">
              <span className="flex items-center gap-1.5">
                <ListOrdered className="size-4" /> {withCount('Fila priorizada', queue.total)}
              </span>
            </TabsTrigger>
            <TabsTrigger value="orders">
              <span className="flex items-center gap-1.5">
                <ClipboardList className="size-4" /> {withCount('Ordens de inspeção', orders?.length)}
              </span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="suspects" className="mt-4">
            <SuspiciousQueueTab queue={queue} />
          </TabsContent>
          <TabsContent value="orders" className="mt-4">
            <InspectionOrdersTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
