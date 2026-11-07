import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ContinuityView } from '@/features/grid_quality/components/ContinuityView'
import { CurrentQualityView } from '@/features/grid_quality/components/CurrentQualityView'
import { PageHeader } from '@/components/layout/PageHeader'

/**
 * Página de Qualidade da Rede, com a visão atual (padrão) e a visão de Continuidade.
 *
 * @returns Cabeçalho e abas "Visão atual" e "Continuidade".
 */
export function GridQualityPage() {
  return (
    <main className="flex w-full flex-col gap-6 px-4 py-8 sm:px-6">
      <PageHeader
        title="Qualidade da Rede"
        description="DEC e FEC por alimentador, do pior para o melhor, para priorizar a manutenção preventiva."
      />

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
