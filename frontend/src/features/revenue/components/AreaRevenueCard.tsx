import { useState } from 'react'
import type { UseQueryResult } from '@tanstack/react-query'
import { AsyncState } from '@/components/feedback/AsyncState'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Pagination } from '@/components/ui/pagination'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AreaRevenueTable } from '@/features/revenue/components/AreaRevenueTable'
import { NeighborhoodHistoryPanel } from '@/features/revenue/components/NeighborhoodHistoryPanel'
import { useRevenueHistoryQuery } from '@/features/revenue/hooks/useRevenueQueries'
import type { BreakdownPage, NeighborhoodRef, RevenueQuery } from '@/features/revenue/types/revenueTypes'
import { DEFAULT_AREA_SORT, nextAreaSort, searchAndSort, toAreaRevenue, type AreaSort, type AreaSortField } from '@/features/revenue/utils/areaRevenue'
import { getRevenueErrorMessage } from '@/features/revenue/utils/revenueErrorMessage'

type AreaLevel = 'bairro' | 'municipio'

const PAGE_SIZE = 10
const MONTHS_PER_YEAR = 12

const monthsBetween = (window: RevenueQuery['atual']) => {
  const [startYear, startMonth] = window.inicio.split('-').map(Number)
  const [endYear, endMonth] = window.fim.split('-').map(Number)
  return Math.max(1, (endYear - startYear) * MONTHS_PER_YEAR + (endMonth - startMonth) + 1)
}

const LEVEL_LABELS: Record<AreaLevel, { tab: string; column: string; plural: string }> = {
  bairro: { tab: 'Bairros', column: 'Bairro', plural: 'bairros' },
  municipio: { tab: 'Municípios', column: 'Município', plural: 'municípios' }
}

interface AreaRevenueCardProps {
  query: RevenueQuery
  neighborhoodsQuery: UseQueryResult<BreakdownPage>
  municipalitiesQuery: UseQueryResult<BreakdownPage>
  onOpenNeighborhood?: (neighborhood: NeighborhoodRef) => void
}

/**
 * Receita, volume e tarifa média de bairros (ou municípios) em tabela com gráfico persistente integrado ao lado.
 * Ao clicar em qualquer linha de bairro na tabela, o painel à direita reflete imediatamente o histórico dos 24 meses.
 *
 * @param props - Consultas com as linhas de cada nível.
 * @returns Card dividido com tabela e gráfico de barras mensal contínuo.
 */
export function AreaRevenueCard({ query, neighborhoodsQuery, municipalitiesQuery }: AreaRevenueCardProps) {
  const [level, setLevel] = useState<AreaLevel>('bairro')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<AreaSort>(DEFAULT_AREA_SORT)
  const [page, setPage] = useState(1)
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<NeighborhoodRef | null>(null)

  const source = level === 'bairro' ? neighborhoodsQuery : municipalitiesQuery
  const areas = searchAndSort((source.data?.items ?? []).map(toAreaRevenue), search, sort)
  const totalPages = Math.max(1, Math.ceil(areas.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const labels = LEVEL_LABELS[level]
  const pageAreas = areas.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const monthsInWindow = monthsBetween(query.atual)

  const defaultNeighborhood = pageAreas.find((area) => area.neighborhood)?.neighborhood ?? null
  const activeNeighborhood = level === 'bairro' ? (selectedNeighborhood ?? defaultNeighborhood) : null
  const historyQuery = useRevenueHistoryQuery(query, activeNeighborhood)
  const selectedKey = activeNeighborhood ? `${activeNeighborhood.municipio}|${activeNeighborhood.bairro}` : null

  const changeSearch = (text: string) => {
    setSearch(text)
    setPage(1)
  }
  const changeLevel = (next: AreaLevel) => {
    setLevel(next)
    setPage(1)
    setSelectedNeighborhood(null)
  }
  const changeSort = (field: AreaSortField) => {
    setSort(nextAreaSort(sort, field))
    setPage(1)
  }

  return (
    <Card variant="glass">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <CardTitle>Receita por {labels.column.toLowerCase()}</CardTitle>
          <CardDescription>
            Receita, volume e tarifa média por {labels.column.toLowerCase()}, com histórico mensal interativo ao lado.
          </CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-64">
            <Input
              type="search"
              aria-label={`Buscar ${labels.column.toLowerCase()}`}
              placeholder={`Buscar ${labels.column.toLowerCase()}`}
              value={search}
              onChange={(event) => changeSearch(event.target.value)}
            />
          </div>
          <Tabs value={level} onValueChange={(next) => changeLevel(next as AreaLevel)}>
            <TabsList aria-label="Nível da receita">
              <TabsTrigger value="bairro">{LEVEL_LABELS.bairro.tab}</TabsTrigger>
              <TabsTrigger value="municipio">{LEVEL_LABELS.municipio.tab}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <AsyncState
          isLoading={source.isLoading}
          isError={source.isError}
          isEmpty={areas.length === 0}
          errorTitle="Não foi possível carregar a receita por área"
          errorDescription={getRevenueErrorMessage(source.error)}
          onRetry={() => void source.refetch()}
          emptyTitle={search ? `Nenhum ${labels.column.toLowerCase()} com esse nome` : 'Nada neste recorte'}
        >
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
            <div className={level === 'bairro' ? 'flex flex-col gap-4 xl:col-span-7' : 'flex flex-col gap-4 xl:col-span-12'}>
              <AreaRevenueTable
                areas={pageAreas}
                monthsInWindow={monthsInWindow}
                levelLabel={labels.column}
                sort={sort}
                selectedKey={selectedKey}
                onSort={changeSort}
                onSelect={setSelectedNeighborhood}
              />
              <Pagination
                page={currentPage}
                totalPages={totalPages}
                summary={`${areas.length} ${labels.plural}`}
                label="Paginação da receita por área"
                onPageChange={setPage}
              />
            </div>
            {level === 'bairro' ? (
              <div className="xl:col-span-5">
                <NeighborhoodHistoryPanel
                  neighborhood={activeNeighborhood}
                  historyQuery={historyQuery}
                />
              </div>
            ) : null}
          </div>
        </AsyncState>
      </CardContent>
    </Card>
  )
}
