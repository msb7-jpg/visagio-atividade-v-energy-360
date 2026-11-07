import { useState } from 'react'
import type { UseQueryResult } from '@tanstack/react-query'
import { AsyncState } from '@/components/feedback/AsyncState'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MunicipalityBars } from '@/features/revenue/components/MunicipalityBars'
import { RmrMap } from '@/features/revenue/components/RmrMap'
import type { BreakdownPage } from '@/features/revenue/types/revenueTypes'
import { getRevenueErrorMessage } from '@/features/revenue/utils/revenueErrorMessage'
import { maxAbsolute, TERRITORY_METRICS, type TerritoryMetric } from '@/features/revenue/utils/territoryMetrics'

interface RevenueTerritoryCardProps {
  municipalQuery: UseQueryResult<BreakdownPage>
  selected?: string
  onSelect: (municipio: string) => void
}

function MapLegend() {
  return (
    <div className="text-muted-foreground flex items-center justify-center gap-2 text-xs" aria-hidden="true">
      <span>Perda</span>
      <span className="bg-destructive/90 size-3 rounded-sm" />
      <span className="bg-destructive/45 size-3 rounded-sm" />
      <span className="bg-success/45 size-3 rounded-sm" />
      <span className="bg-success/90 size-3 rounded-sm" />
      <span>Ganho</span>
    </div>
  )
}

/**
 * Card territorial da Receita: mapa da RMR e barras por município, pintados pela variação ou por um dos efeitos.
 * Clicar num município aplica o filtro de município da tela; clicar de novo remove.
 *
 * @param props - Consulta com todos os municípios, o município filtrado e o callback de filtro.
 * @returns Card com o seletor de métrica, o mapa e as barras ligados pelo destaque.
 */
export function RevenueTerritoryCard({ municipalQuery, selected, onSelect }: RevenueTerritoryCardProps) {
  const [metric, setMetric] = useState<TerritoryMetric>('variacao_rs')
  const [hovered, setHovered] = useState<string | null>(null)
  const rows = (municipalQuery.data?.items ?? []).filter((row) => row.municipio)
  const maximum = maxAbsolute(rows, metric)
  const toggle = (municipio: string) => onSelect(selected === municipio ? '' : municipio)
  const shared = { rows, metric, maximum, selected, hovered, onHover: setHovered, onSelect: toggle }

  return (
    <Card variant="glass">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <CardTitle>Onde a receita mudou</CardTitle>
          <CardDescription>Clique num município para filtrar a tela.</CardDescription>
        </div>
        <Tabs value={metric} onValueChange={(next) => setMetric(next as TerritoryMetric)}>
          <TabsList aria-label="Métrica do mapa">
            {TERRITORY_METRICS.map((option) => (
              <TabsTrigger key={option.value} value={option.value}>{option.label}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <AsyncState
          isLoading={municipalQuery.isLoading}
          isError={municipalQuery.isError}
          isEmpty={rows.length === 0}
          errorTitle="Não foi possível carregar os municípios"
          errorDescription={getRevenueErrorMessage(municipalQuery.error)}
          onRetry={() => void municipalQuery.refetch()}
          emptyTitle="Sem municípios neste recorte"
        >
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-5">
            <div className="mx-auto flex w-full max-w-64 flex-col gap-3 lg:col-span-2">
              <RmrMap {...shared} />
              <MapLegend />
            </div>
            <div className="lg:col-span-3">
              <MunicipalityBars {...shared} />
            </div>
          </div>
        </AsyncState>
      </CardContent>
    </Card>
  )
}
