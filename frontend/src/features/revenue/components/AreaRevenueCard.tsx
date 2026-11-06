import { useState } from 'react'
import type { UseQueryResult } from '@tanstack/react-query'
import { AsyncState } from '@/components/feedback/AsyncState'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Pagination } from '@/components/ui/pagination'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AreaRevenueTable } from '@/features/revenue/components/AreaRevenueTable'
import type { BreakdownPage, NeighborhoodRef } from '@/features/revenue/types/revenueTypes'
import { searchAndSort, toAreaRevenue, type AreaSortField } from '@/features/revenue/utils/areaRevenue'
import { getRevenueErrorMessage } from '@/features/revenue/utils/revenueErrorMessage'

type AreaLevel = 'bairro' | 'municipio'

const PAGE_SIZE = 10
const LEVEL_LABELS: Record<AreaLevel, { tab: string; column: string; plural: string }> = {
  bairro: { tab: 'Bairros', column: 'Bairro', plural: 'bairros' },
  municipio: { tab: 'Municípios', column: 'Município', plural: 'municípios' }
}

interface AreaRevenueCardProps {
  neighborhoodsQuery: UseQueryResult<BreakdownPage>
  municipalitiesQuery: UseQueryResult<BreakdownPage>
  onOpenNeighborhood: (neighborhood: NeighborhoodRef) => void
}

/**
 * Receita, volume e tarifa média de todos os bairros (ou municípios) numa tabela só, com busca pelo nome.
 * Responde "quanto fatura este bairro?" sem abrir bairro por bairro; o nome abre os 24 meses.
 *
 * @param props - Consultas com todas as linhas de cada nível e o callback do histórico.
 * @returns Card com nível, busca, tabela ordenável e paginação.
 */
export function AreaRevenueCard({ neighborhoodsQuery, municipalitiesQuery, onOpenNeighborhood }: AreaRevenueCardProps) {
  const [level, setLevel] = useState<AreaLevel>('bairro')
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState<AreaSortField>('revenue')
  const [page, setPage] = useState(1)
  const source = level === 'bairro' ? neighborhoodsQuery : municipalitiesQuery
  const areas = searchAndSort((source.data?.items ?? []).map(toAreaRevenue), search, sortField)
  const totalPages = Math.max(1, Math.ceil(areas.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const labels = LEVEL_LABELS[level]
  const changeSearch = (text: string) => {
    setSearch(text)
    setPage(1)
  }
  const changeLevel = (next: AreaLevel) => {
    setLevel(next)
    setPage(1)
  }
  const changeSort = (field: AreaSortField) => {
    setSortField(field)
    setPage(1)
  }

  return (
    <Card variant="glass">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <CardTitle>Receita por {labels.column.toLowerCase()}</CardTitle>
          <CardDescription>Receita, volume e tarifa média de cada {labels.column.toLowerCase()} no período de comparação.</CardDescription>
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
          <AreaRevenueTable
            areas={areas.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)}
            levelLabel={labels.column}
            sortField={sortField}
            onSort={changeSort}
            onOpen={onOpenNeighborhood}
          />
          <Pagination
            page={currentPage}
            totalPages={totalPages}
            summary={`${areas.length} ${labels.plural}`}
            label="Paginação da receita por área"
            onPageChange={setPage}
          />
        </AsyncState>
      </CardContent>
    </Card>
  )
}
