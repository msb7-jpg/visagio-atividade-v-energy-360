export interface DecBand {
  label: string
  /** Limite superior da faixa (exclusivo) em horas. */
  upTo: number
  /** Classe semântica da amostra da legenda. */
  swatch: string
  /** Token de cor para o gráfico. */
  fill: string
}

/** Faixas de DEC do mapa, da menor para a maior. */
export const DEC_BANDS: DecBand[] = [
  { label: 'até 2,5 h', upTo: 2.5, swatch: 'bg-chart-4', fill: 'var(--color-chart-4)' },
  { label: '2,5 a 5 h', upTo: 5, swatch: 'bg-chart-2', fill: 'var(--color-chart-2)' },
  { label: '5 a 10 h', upTo: 10, swatch: 'bg-warning', fill: 'var(--color-warning)' },
  { label: '10 h ou mais', upTo: Number.POSITIVE_INFINITY, swatch: 'bg-destructive', fill: 'var(--color-destructive)' }
]

/**
 * Faixa de DEC a que um valor pertence.
 *
 * @param decHours - DEC em horas.
 * @returns Faixa com rótulo e cores semânticas.
 */
export function bandOf(decHours: number): DecBand {
  return DEC_BANDS.find((band) => decHours < band.upTo) ?? DEC_BANDS[DEC_BANDS.length - 1]
}
