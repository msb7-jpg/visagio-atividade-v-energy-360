import { useState } from 'react'
import { AsyncState } from '@/components/feedback/AsyncState'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Pagination } from '@/components/ui/pagination'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useExcludedUnitsQuery } from '@/features/loss_management/hooks/useLossQueries'
import type { ExclusionReason } from '@/features/loss_management/types/excludedTypes'
import {
  describeExclusion,
  EXCLUSION_HINTS,
  EXCLUSION_LABELS,
  formatReturnDate
} from '@/features/loss_management/utils/exclusionLabels'
import { formatInteger } from '@/features/loss_management/utils/lossFormatters'

const EMPTY_VALUE = '—'
const PAGE_SIZE = 25

type ExcludedPager = Pick<ReturnType<typeof useExcludedUnitsQuery>, 'data' | 'hasNextPage' | 'fetchNextPage'>

const countLoaded = (data: ExcludedPager['data']) => data?.pages.reduce((count, page) => count + page.itens.length, 0) ?? 0

/**
 * Busca no servidor os lotes seguintes até cobrir a página pedida, ou até a lista acabar.
 *
 * @param pager - Estado da consulta infinita (o resultado de cada busca serve de ponto de partida para a próxima).
 * @param needed - Quantas UCs a página pedida exige.
 */
async function loadUntil(pager: ExcludedPager, needed: number): Promise<void> {
  const loaded = countLoaded(pager.data)
  if (loaded >= needed || !pager.hasNextPage) return
  const next = await pager.fetchNextPage()
  if (countLoaded(next.data) > loaded) await loadUntil(next, needed)
}

/**
 * Aba "Fora da fila": UCs com queda de consumo que a fila deixou de fora, com o motivo e quando voltam a ser avaliadas.
 *
 * @returns Resumo por motivo (filtra a tabela) e a tabela em páginas de 25, buscando no servidor os lotes que faltam.
 */
export function ExcludedQueueTab() {
  const [reason, setReason] = useState<ExclusionReason | undefined>(undefined)
  const query = useExcludedUnitsQuery(reason ? { motivo: reason } : {})
  const units = query.data?.pages.flatMap((page) => page.itens) ?? []
  const total = query.data?.pages[0]?.total ?? 0
  const summary = query.data?.pages[0]?.resumo ?? []
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const firstIndex = (currentPage - 1) * PAGE_SIZE
  const pageUnits = units.slice(firstIndex, firstIndex + PAGE_SIZE)

  const changeReason = (nextReason: ExclusionReason | undefined) => {
    setReason(nextReason)
    setPage(1)
  }
  const changePage = (nextPage: number) => {
    setPage(nextPage)
    void loadUntil(query, nextPage * PAGE_SIZE)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtrar por motivo da exclusão">
        {summary.map((entry) => (
          <Button
            key={entry.motivo}
            type="button"
            size="sm"
            variant={reason === entry.motivo ? 'default' : 'outline'}
            aria-pressed={reason === entry.motivo}
            title={EXCLUSION_HINTS[entry.motivo]}
            onClick={() => changeReason(reason === entry.motivo ? undefined : entry.motivo)}
          >
            {EXCLUSION_LABELS[entry.motivo]} ({formatInteger(entry.total)})
          </Button>
        ))}
      </div>
      <Card className="p-4">
        <AsyncState
          isLoading={query.isLoading}
          isError={query.isError}
          isEmpty={units.length === 0}
          errorTitle="Não foi possível carregar as UCs fora da fila"
          errorDescription="Verifique a conexão com a API e se as tabelas Gold de cadastro e medição estão disponíveis."
          onRetry={() => void query.refetch()}
          emptyTitle="Nenhuma UC fora da fila"
          emptyDescription="Toda UC com queda de consumo está na fila."
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>UC</TableHead>
                <TableHead>Bairro / Município</TableHead>
                <TableHead>Classe</TableHead>
                <TableHead>Motivo da exclusão</TableHead>
                <TableHead>Detalhe</TableHead>
                <TableHead>Volta a ser avaliada</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageUnits.map((unit) => (
                <TableRow key={unit.id_uc}>
                  <TableCell>
                    <span className="font-mono">{unit.id_uc}</span>
                  </TableCell>
                  <TableCell>
                    {unit.bairro ?? EMPTY_VALUE}
                    <span className="text-muted-foreground block text-xs">{unit.municipio ?? EMPTY_VALUE}</span>
                  </TableCell>
                  <TableCell>{unit.classe_consumo ?? EMPTY_VALUE}</TableCell>
                  <TableCell>{EXCLUSION_LABELS[unit.motivo_exclusao]}</TableCell>
                  <TableCell>
                    <span className="text-muted-foreground">{describeExclusion(unit)}</span>
                  </TableCell>
                  <TableCell>{formatReturnDate(unit)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-3 flex flex-col gap-3">
            <span className="text-muted-foreground text-xs">
              {query.isFetchingNextPage && pageUnits.length === 0
                ? 'Carregando as UCs desta página…'
                : `Mostrando ${formatInteger(firstIndex + 1)}–${formatInteger(firstIndex + pageUnits.length)} de ${formatInteger(total)} UCs`}
            </span>
            {totalPages > 1 ? (
              <Pagination page={currentPage} totalPages={totalPages} onPageChange={changePage} label="Paginação das UCs fora da fila" />
            ) : null}
          </div>
        </AsyncState>
      </Card>
    </div>
  )
}
