import { describe, expect, test } from 'vitest'
import { DEC_BANDS } from '@/features/grid_quality/utils/continuityBands'
import { contrastRatio, hexToRgb, readTokens } from '@/test/contrastTokens'

const MIN_TEXT_CONTRAST = 4.5
const MIN_GRAPHIC_CONTRAST = 3
const NOTE_SURFACES = ['background', 'card', 'muted'] as const

describe.each([
  ['claro', ':root'],
  ['escuro', '.dark']
] as const)('contraste no tema %s', (_theme, selector) => {
  const tokens = readTokens(selector)

  test('o botão primário do login passa no AA', () => {
    expect(contrastRatio(hexToRgb(tokens['primary-foreground']), hexToRgb(tokens.primary))).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST)
  })

  test.each(NOTE_SURFACES)('notas e cabeçalhos de tabela (muted-foreground) passam no AA sobre %s', (surface) => {
    expect(contrastRatio(hexToRgb(tokens['muted-foreground']), hexToRgb(tokens[surface]))).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST)
  })

  test.each(DEC_BANDS)('a faixa "$label" do mapa tem 3:1 contra o fundo e o card', (band) => {
    const token = band.fill.replace('var(--color-', '').replace(')', '')
    const color = hexToRgb(tokens[token])
    expect(contrastRatio(color, hexToRgb(tokens.background))).toBeGreaterThanOrEqual(MIN_GRAPHIC_CONTRAST)
    expect(contrastRatio(color, hexToRgb(tokens.card))).toBeGreaterThanOrEqual(MIN_GRAPHIC_CONTRAST)
  })

  test('as 4 faixas do mapa usam cores diferentes entre si', () => {
    const fills = DEC_BANDS.map((band) => tokens[band.fill.replace('var(--color-', '').replace(')', '')])
    expect(new Set(fills).size).toBe(DEC_BANDS.length)
  })
})
