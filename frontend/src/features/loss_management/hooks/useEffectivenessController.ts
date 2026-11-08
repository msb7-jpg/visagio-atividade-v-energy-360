import { useState } from 'react'
import { useBacktestSeriesQuery, useInspectionsQuery } from '@/features/loss_management/hooks/useLossQueries'
import { pickCutoff, pickSize, resultsBySize } from '@/features/loss_management/utils/effectivenessSelection'

/**
 * Estado da aba Efetividade: ordens reais de campo, backtest de todos os cortes e o corte e o tamanho em detalhe.
 *
 * @returns Consultas das ordens e da série, as ordens, os resultados por corte no tamanho escolhido (o padrão até
 * alguém escolher outro), o corte em detalhe (o mais antigo até alguém escolher outro, ou se o escolhido sair da
 * série), os tamanhos medidos, o resultado do corte em cada tamanho e as funções que trocam corte e tamanho sem nova
 * consulta.
 */
export function useEffectivenessController() {
  const inspections = useInspectionsQuery()
  const series = useBacktestSeriesQuery()
  const [chosenCutoff, setChosenCutoff] = useState<string | null>(null)
  const [chosenSize, setChosenSize] = useState<number | null>(null)
  const sizes = series.data?.tamanhos ?? []
  const defaultSize = series.data?.tamanho ?? null
  const activeSize = pickSize(sizes, chosenSize, defaultSize)
  const results = activeSize?.cortes ?? series.data?.cortes ?? []
  const selected = pickCutoff(results, chosenCutoff)

  return {
    inspections,
    orders: inspections.data ?? [],
    series,
    results,
    selected,
    selectCutoff: setChosenCutoff,
    sizes: sizes.map((entry) => entry.tamanho),
    size: activeSize?.tamanho ?? defaultSize,
    selectSize: setChosenSize,
    bySize: resultsBySize(sizes, selected?.data_corte ?? null)
  }
}
