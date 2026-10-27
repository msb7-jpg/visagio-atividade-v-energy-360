import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ContinuityView } from '@/features/grid_quality/components/ContinuityView'
import { CurrentQualityView } from '@/features/grid_quality/components/CurrentQualityView'

/**
 * Página de Qualidade da Rede, com a visão atual (padrão) e a visão de Continuidade.
 *
 * @returns Cabeçalho e abas "Visão atual" e "Continuidade".
 */
export function GridQualityPage() {
  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-foreground text-xl font-bold tracking-tight">Qualidade da Rede</h1>
        <p className="text-muted-foreground text-sm">
          DEC e FEC por alimentador, dos piores para os melhores, para direcionar a manutenção preventiva.
        </p>
      </div>

      <Tabs defaultValue="atual">
        <TabsList>
          <TabsTrigger value="atual">Visão atual</TabsTrigger>
          <TabsTrigger value="continuidade">Continuidade</TabsTrigger>
        </TabsList>
        <TabsContent value="atual" className="mt-4">
          <CurrentQualityView />
        </TabsContent>
        <TabsContent value="continuidade" className="mt-4">
          <ContinuityView />
        </TabsContent>
      </Tabs>
    </main>
  )
}
