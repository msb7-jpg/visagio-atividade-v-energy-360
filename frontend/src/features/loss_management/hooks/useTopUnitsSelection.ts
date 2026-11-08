import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import type { useSuspiciousUnitsQuery } from '@/features/loss_management/hooks/useLossQueries'
import { suspiciousUnitsQueryOptions } from '@/features/loss_management/queries/lossQueries'
import type { SuspiciousUnit, SuspiciousUnitsFilter } from '@/features/loss_management/types/lossTypes'
import { TOP_SELECTION_COUNT } from '@/features/loss_management/utils/queueBands'
import { MAX_SELECTION_COUNT, firstFreeUnitIds, parsePositiveInt } from '@/features/loss_management/utils/queueSelection'

interface TopUnitsSelectionArgs {
  queueQuery: ReturnType<typeof useSuspiciousUnitsQuery>
  /** UCs da fila já carregadas, em ordem de prioridade. */
  units: SuspiciousUnit[]
  filters: SuspiciousUnitsFilter
  setFilters: (filters: SuspiciousUnitsFilter) => void
  selectIds: (idUcs: readonly string[]) => void
}

/**
 * "Quantas inspecionar": o N digitado e a ação que marca as N primeiras UCs livres da fila.
 *
 * O N fica só no navegador: a equipe decide a capacidade e o servidor não a guarda. A marcação vale no máximo
 * `MAX_SELECTION_COUNT` UCs, o que o resumo da seleção aceita por vez.
 *
 * @param args - Consulta da fila, UCs carregadas, filtros e a ação de marcar.
 * @returns O texto do campo N, se a marcação está rodando e a ação de marcar.
 */
export function useTopUnitsSelection({ queueQuery, units, filters, setFilters, selectIds }: TopUnitsSelectionArgs) {
  const queryClient = useQueryClient()
  const [topCountText, setTopCountText] = useState(String(TOP_SELECTION_COUNT))
  const [isSelecting, setIsSelecting] = useState(false)
  const requestedCount = parsePositiveInt(topCountText)
  const topCount = requestedCount === null ? null : Math.min(requestedCount, MAX_SELECTION_COUNT)

  // Traz mais páginas da fila até haver UCs livres suficientes para o N pedido, a fila acabar ou uma página falhar.
  const loadUnitsFor = async (count: number) => {
    let loadedUnits = units
    let hasMore = queueQuery.hasNextPage
    while (hasMore && firstFreeUnitIds(loadedUnits, count).length < count) {
      const nextPage = await queueQuery.fetchNextPage()
      const nextUnits = nextPage.data?.pages.flatMap((page) => page.itens) ?? loadedUnits
      // `fetchNextPage` não lança: numa falha devolve `isError` e as páginas antigas, e sem esta saída o laço repetiria a chamada.
      const isStalled = nextPage.isError || nextUnits.length === loadedUnits.length
      loadedUnits = nextUnits
      hasMore = nextPage.hasNextPage && !isStalled
    }
    return loadedUnits
  }

  // Com a fila filtrada em ordem gerada ou em campo não há UC livre para marcar: a ação passa o filtro de situação
  // para "na fila" e marca o topo dessa fila; a seleção aparece quando a lista nova carrega.
  const markTopUnits = async (count: number) => {
    if (filters.situacao === undefined || filters.situacao === 'na_fila') {
      selectIds(firstFreeUnitIds(await loadUnitsFor(count), count))
      return
    }
    const freeFilters = { ...filters, situacao: 'na_fila' as const }
    setFilters(freeFilters)
    try {
      // Mesma chave de cache da lista: a chamada é uma só, e uma falha também aparece na lista com o botão de tentar de novo.
      const freeQueue = await queryClient.infiniteQuery(suspiciousUnitsQueryOptions(freeFilters))
      selectIds(firstFreeUnitIds(freeQueue.pages.flatMap((page) => page.itens), count))
    } catch {
      // O erro fica no estado da query da lista (isError), que mostra o aviso; sem a fila não há o que marcar.
    }
  }

  // Trava a ação enquanto roda: dois cliques seguidos disputariam o mesmo `fetchNextPage` e se cancelariam.
  const selectTopUnits = async () => {
    if (topCount === null || isSelecting) return
    setIsSelecting(true)
    try {
      await markTopUnits(topCount)
    } finally {
      setIsSelecting(false)
    }
  }

  return { topCountText, setTopCountText, isSelecting, selectTopUnits: () => void selectTopUnits() }
}
