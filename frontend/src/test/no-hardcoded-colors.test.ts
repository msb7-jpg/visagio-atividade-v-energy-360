import { describe, expect, test } from 'vitest'

/** Fora de `index.css` (onde ficam os tokens), nenhum arquivo de componente pode ter cor fixa. */
const sources = import.meta.glob(
  ['/src/**/*.{ts,tsx}', '!/src/**/__tests__/**', '!/src/**/*.test.{ts,tsx}', '!/src/test/**'],
  { query: '?raw', import: 'default', eager: true }
) as Record<string, string>

const TAILWIND_PALETTE = 'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose'
const FIXED_COLOR_PATTERNS: Record<string, RegExp> = {
  hexadecimal: /(?<![\w&])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b/,
  'rgb/hsl': /\b(?:rgba?|hsla?)\(/,
  'classe de cor fixa do Tailwind': new RegExp(
    `\\b(?:bg|text|border|ring|fill|stroke|from|to|via|shadow|divide|outline|decoration|accent|caret)-(?:white|black|(?:${TAILWIND_PALETTE})-\\d{2,3})\\b`
  )
}

/** Exceções justificadas: caminho do arquivo e motivo. Hoje não há nenhuma. */
const ALLOWED_FILES: Record<string, string> = {}

describe('cores fixas fora do index.css', () => {
  const files = Object.entries(sources).filter(([filePath]) => !(filePath in ALLOWED_FILES))

  test('há arquivos para varrer', () => {
    expect(files.length).toBeGreaterThan(100)
  })

  test.each(Object.entries(FIXED_COLOR_PATTERNS))('nenhum arquivo usa %s', (_kind, pattern) => {
    const offenders = files.filter(([, content]) => pattern.test(content)).map(([filePath]) => filePath)

    expect(offenders).toEqual([])
  })
})
