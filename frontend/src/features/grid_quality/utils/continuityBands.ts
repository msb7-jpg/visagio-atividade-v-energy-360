export interface DecBand {
  label: string
  /** Limite superior da faixa (exclusivo) em horas. */
  upTo: number
  /** Classe semântica da amostra da legenda. */
  swatch: string
  /** Token de cor para o gráfico. */
  fill: string
  /** Classe de preenchimento do município no mapa. */
  mapFill: string
}

/**
 * Faixas de DEC do mapa, da menor para a maior: escala de azul (`map-1` a `map-4`) que escurece conforme o DEC piora,
 * com degraus bem separados e sem o verde e o vermelho de ganho e perda das outras telas.
 */
export const DEC_BANDS: DecBand[] = [
  { label: 'até 2,5 h', upTo: 2.5, swatch: 'bg-map-1', fill: 'var(--color-map-1)', mapFill: 'fill-map-1' },
  { label: '2,5 a 5 h', upTo: 5, swatch: 'bg-map-2', fill: 'var(--color-map-2)', mapFill: 'fill-map-2' },
  { label: '5 a 10 h', upTo: 10, swatch: 'bg-map-3', fill: 'var(--color-map-3)', mapFill: 'fill-map-3' },
  { label: '10 h ou mais', upTo: Number.POSITIVE_INFINITY, swatch: 'bg-map-4', fill: 'var(--color-map-4)', mapFill: 'fill-map-4' }
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
