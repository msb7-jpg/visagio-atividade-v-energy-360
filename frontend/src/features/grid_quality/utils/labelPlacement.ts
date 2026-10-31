type Side = 'top' | 'left' | 'right' | 'bottom'

export interface LabelPlacement {
  dx: number
  dy: number
  anchor: 'start' | 'middle' | 'end'
}

/** Lado do rótulo dos 14 municípios; as coordenadas são aproximadas (ADR-025), então os vizinhos se afastam por aqui. */
export const LABEL_SIDES: Record<string, Side> = {
  'Abreu e Lima': 'left',
  Araçoiaba: 'top',
  'Cabo de Santo Agostinho': 'top',
  Camaragibe: 'top',
  Igarassu: 'right',
  'Ilha de Itamaracá': 'right',
  Ipojuca: 'top',
  Itapissuma: 'top',
  'Jaboatão dos Guararapes': 'bottom',
  Moreno: 'left',
  Olinda: 'right',
  Paulista: 'right',
  Recife: 'bottom',
  'São Lourenço da Mata': 'left'
}

const GAP = 4
const TEXT_HEIGHT = 8

/**
 * Deslocamento e âncora do rótulo de um município em relação ao centro do ponto.
 *
 * @param name - Nome de exibição do município.
 * @param radius - Raio do ponto em pixels.
 * @returns Deslocamento em x e y e o `textAnchor` do texto SVG; municípios sem entrada ficam em cima.
 */
export function labelPlacement(name: string, radius: number): LabelPlacement {
  const reach = radius + GAP
  const placements: Record<Side, LabelPlacement> = {
    top: { dx: 0, dy: -reach, anchor: 'middle' },
    bottom: { dx: 0, dy: reach + TEXT_HEIGHT, anchor: 'middle' },
    left: { dx: -reach, dy: TEXT_HEIGHT / 2, anchor: 'end' },
    right: { dx: reach, dy: TEXT_HEIGHT / 2, anchor: 'start' }
  }
  return placements[LABEL_SIDES[name] ?? 'top']
}
