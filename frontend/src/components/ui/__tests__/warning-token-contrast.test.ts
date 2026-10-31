import { describe, expect, test } from 'vitest'
import { blend, contrastRatio, hexToRgb, readTokens } from '@/test/contrastTokens'

const MIN_TEXT_CONTRAST = 4.5
/** O Badge e o Alert de aviso usam `bg-warning/15` com o texto na própria cor. */
const WARNING_TINT = 0.15
const SURFACES = ['card', 'background', 'muted', 'secondary', 'accent'] as const

describe.each([
  ['claro', ':root'],
  ['escuro', '.dark']
] as const)('token --warning no tema %s', (_theme, selector) => {
  const tokens = readTokens(selector)

  test.each(SURFACES)('o texto do selo de aviso passa no AA sobre a superfície %s', (surface) => {
    const warning = hexToRgb(tokens.warning)
    const tintedBackground = blend(warning, hexToRgb(tokens[surface]), WARNING_TINT)

    expect(contrastRatio(warning, tintedBackground)).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST)
  })
})
