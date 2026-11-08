import { useState } from 'react'
import { useBacktestSeriesQuery, useInspectionsQuery } from '@/features/loss_management/hooks/useLossQueries'

/**
 * Estado da aba Efetividade: ordens reais de campo, backtest de todos os cortes e o corte aberto em detalhe.
 *
 * @returns Consultas das ordens e da série, as ordens, os resultados por corte, o corte em detalhe (o mais antigo
 * até alguém escolher outro, ou se o escolhido sair da série) e a função que troca o corte sem nova consulta.
 */
export function useEffectivenessController() {
  const inspections = useInspectionsQuery()
  const series = useBacktestSeriesQuery()
  const [chosenCutoff, setChosenCutoff] = useState<string | null>(null)
  const results = series.data?.cortes ?? []
  const chosen = chosenCutoff === null ? undefined : results.find((result) => result.data_corte === chosenCutoff)
  const selected = chosen ?? results[0] ?? null

  return {
    inspections,
    orders: inspections.data ?? [],
    series,
    results,
    selected,
    selectCutoff: setChosenCutoff
  }
}
