import { ArrowLeft, ClipboardList, ShieldAlert } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { InspectionOrdersTab } from '@/features/loss_management/components/InspectionOrdersTab'
import { SuspiciousQueueTab } from '@/features/loss_management/components/SuspiciousQueueTab'

/**
 * Página da Gestão de Perdas: fila de suspeitas e ordens de inspeção em campo.
 *
 * @returns Página com abas "Fila de Suspeitas" e "Ordens em Campo".
 */
export function LossManagementPage() {
  return (
    <div className="bg-background min-h-dvh">
      <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-foreground text-xl font-bold tracking-tight">Gestão de Perdas</h1>
            <p className="text-muted-foreground text-sm">
              Fila de UCs suspeitas da mais promissora para a menos promissora, com motivo e energia a recuperar.
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/dashboard">
              <span className="flex items-center gap-1.5">
                <ArrowLeft className="size-3.5" /> Voltar ao painel
              </span>
            </Link>
          </Button>
        </div>

        <Tabs defaultValue="suspects">
          <TabsList>
            <TabsTrigger value="suspects">
              <span className="flex items-center gap-1.5">
                <ShieldAlert className="size-4" /> Fila de Suspeitas
              </span>
            </TabsTrigger>
            <TabsTrigger value="orders">
              <span className="flex items-center gap-1.5">
                <ClipboardList className="size-4" /> Ordens em Campo
              </span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="suspects" className="mt-4">
            <SuspiciousQueueTab />
          </TabsContent>
          <TabsContent value="orders" className="mt-4">
            <InspectionOrdersTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
