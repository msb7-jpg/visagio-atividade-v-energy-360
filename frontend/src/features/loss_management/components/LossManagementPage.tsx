import { ClipboardList, ListOrdered } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { InspectionOrdersTab } from '@/features/loss_management/components/InspectionOrdersTab'
import { SuspiciousQueueTab } from '@/features/loss_management/components/SuspiciousQueueTab'
import { useInspectionsQuery } from '@/features/loss_management/hooks/useLossQueries'
import { useSuspiciousQueueController } from '@/features/loss_management/hooks/useSuspiciousQueueController'
import { formatInteger } from '@/features/loss_management/utils/lossFormatters'
import { PageHeader } from '@/components/layout/PageHeader'

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
        <PageHeader
          title="Fila de Inspeção"
          description="UCs suspeitas na ordem de retorno esperado: chance de irregularidade × energia recuperável."
        />

        <Tabs defaultValue="suspects">
          <TabsList>
            <TabsTrigger value="suspects">
              <ListOrdered aria-hidden="true" className="size-4" /> {withCount('Fila priorizada', queue.total)}
            </TabsTrigger>
            <TabsTrigger value="orders">
              <ClipboardList aria-hidden="true" className="size-4" /> {withCount('Ordens de inspeção', orders?.length)}
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
