import { MapPinned, SearchX } from 'lucide-react'
import type { UseQueryResult } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BreakdownTable } from '@/features/revenue/components/BreakdownTable'
import { AsyncState } from '@/components/feedback/AsyncState'
import { getRevenueErrorMessage } from '@/features/revenue/utils/revenueErrorMessage'
import { TablePagination } from '@/features/revenue/components/TablePagination'
import type { useRevenueRankingControls } from '@/features/revenue/hooks/useRevenueRankingControls'
import type { BreakdownLevel, BreakdownPage } from '@/features/revenue/types/revenueTypes'

interface RevenueRankingCardProps {
  breakdownQuery: UseQueryResult<BreakdownPage>
  ranking: ReturnType<typeof useRevenueRankingControls>
}

const LEVEL_TABS: { value: BreakdownLevel; label: string }[] = [
  { value: 'bairro', label: 'Bairros' },
  { value: 'municipio', label: 'Municípios' },
  { value: 'classe_consumo', label: 'Classes' }
]

/**
 * Card do ranking territorial: seletor de nível, tabela ordenável e paginação.
 * Por padrão a maior perda por efeito-volume vem primeiro.
 *
 * @param props - Resultado da consulta do ranking e controles (nível, ordenação, página, seleção).
 * @returns Card com estados de carregamento, erro, vazio ou a tabela.
 */
export function RevenueRankingCard({ breakdownQuery, ranking }: RevenueRankingCardProps) {
  const { data, isLoading, isError, error } = breakdownQuery
  const { controls } = ranking
  return (
    <Card variant="glass">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <CardTitle>Onde a receita foi perdida</CardTitle>
          <CardDescription>
            Ordenado pela maior perda por efeito-volume. {controls.nivel === 'bairro' ? 'Clique no bairro para ver 24 meses de histórico.' : ''}
          </CardDescription>
        </div>
        <Tabs value={controls.nivel} onValueChange={(level) => ranking.changeLevel(level as BreakdownLevel)}>
          <TabsList>
            {LEVEL_TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <AsyncState
          isLoading={isLoading}
          isError={isError}
          isEmpty={data?.items.length === 0}
          errorTitle="Não foi possível carregar o ranking"
          errorDescription={getRevenueErrorMessage(error)}
          emptyTitle="Nenhuma linha neste recorte"
          emptyIcon={<SearchX className="size-10" />}
        >
          {data ? (
            <>
              <BreakdownTable rows={data.items} controls={controls} onSort={ranking.toggleSort} onSelect={ranking.openNeighborhood} />
              <TablePagination page={data.page} totalPages={data.total_pages} total={data.total} onPageChange={ranking.changePage} />
            </>
          ) : null}
        </AsyncState>
        <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
          <MapPinned className="size-3.5" /> Efeito-preço e efeito-volume somam, com o efeito cruzado, a variação de cada linha.
        </p>
      </CardContent>
    </Card>
  )
}
