/// <reference types="node" />
import { appendFileSync } from 'node:fs'
import { describe, expect, test } from 'vitest'
import { blend, contrastRatio, hexToRgb, readTokens, type Rgb } from '@/test/contrastTokens'

const TEXT_MIN = 4.5
const NON_TEXT_MIN = 3
/** Receitas de tingimento: `color-mix(in srgb, var(--token) N%, var(--card))`. */
const BADGE_TINT = 0.16
const ROW_TINT = 0.08
const STATUS_TOKENS = ['primary', 'success', 'warning', 'destructive'] as const

type Tokens = Record<string, string>

interface Pair {
  label: string
  kind: 'texto' | 'não texto'
  foreground: (tokens: Tokens) => Rgb
  background: (tokens: Tokens) => Rgb
}

const token = (name: string) => (tokens: Tokens) => hexToRgb(tokens[name])
const tinted = (name: string, share: number) => (tokens: Tokens) =>
  blend(hexToRgb(tokens[name]), hexToRgb(tokens.card), share)

function pair(label: string, kind: Pair['kind'], foreground: Pair['foreground'], background: Pair['background']): Pair {
  return { label, kind, foreground, background }
}

const PAIRS: Pair[] = [
  pair('texto sobre card', 'texto', token('foreground'), token('card')),
  pair('texto sobre fundo', 'texto', token('foreground'), token('background')),
  pair('texto suave sobre card', 'texto', token('muted-foreground'), token('card')),
  pair('texto suave sobre fundo', 'texto', token('muted-foreground'), token('background')),
  pair('texto suave sobre muted', 'texto', token('muted-foreground'), token('muted')),
  pair('primário sobre fundo', 'texto', token('primary'), token('background')),
  pair('primário sobre card', 'texto', token('primary'), token('card')),
  pair('texto sobre botão primário', 'texto', token('primary-foreground'), token('primary')),
  pair('texto sobre secondary', 'texto', token('secondary-foreground'), token('secondary')),
  pair('texto sobre accent', 'texto', token('accent-foreground'), token('accent')),
  pair('texto sobre destructive', 'texto', token('destructive-foreground'), token('destructive')),
  pair('texto sobre success', 'texto', token('success-foreground'), token('success')),
  pair('texto sobre warning', 'texto', token('warning-foreground'), token('warning')),
  ...STATUS_TOKENS.map((name) => pair(`selo ${name} (texto sobre tingido 16%)`, 'texto', token(name), tinted(name, BADGE_TINT))),
  ...STATUS_TOKENS.map((name) => pair(`linha ${name} (texto sobre tingido 8%)`, 'texto', token('foreground'), tinted(name, ROW_TINT))),
  pair('borda de campo sobre card', 'não texto', token('input'), token('card')),
  pair('borda de campo sobre fundo', 'não texto', token('input'), token('background')),
  pair('anel de foco sobre card', 'não texto', token('ring'), token('card')),
  pair('anel de foco sobre fundo', 'não texto', token('ring'), token('background')),
  ...[1, 2, 3, 4, 5].map((index) => pair(`série chart-${index} sobre card`, 'não texto', token(`chart-${index}`), token('card')))
]

/** Pares abaixo do mínimo que o time já conhece; ficam listados aqui em vez de trocar o token (ver changelog). */
const KNOWN_BELOW_MINIMUM = new Set<string>([])

const THEMES = [
  ['claro', ':root'],
  ['escuro', '.dark']
] as const

function measure(selector: ':root' | '.dark') {
  const tokens = readTokens(selector)
  return PAIRS.map((entry) => ({
    ...entry,
    ratio: contrastRatio(entry.foreground(tokens), entry.background(tokens)),
    minimum: entry.kind === 'texto' ? TEXT_MIN : NON_TEXT_MIN
  }))
}

describe.each(THEMES)('contraste dos tokens no tema %s', (theme, selector) => {
  const rows = measure(selector)

  test.each(rows.filter((row) => !KNOWN_BELOW_MINIMUM.has(`${theme}: ${row.label}`)))(
    '$label passa no mínimo',
    ({ ratio, minimum }) => {
      expect(ratio).toBeGreaterThanOrEqual(minimum)
    }
  )

  test('grava a tabela de razões no arquivo de CONTRAST_TABLE_FILE, quando definido', () => {
    const tableFile = process.env.CONTRAST_TABLE_FILE
    if (tableFile) {
      const lines = rows.map((row) => `| ${theme} | ${row.label} | ${row.ratio.toFixed(2)} | ${row.minimum} |`)
      appendFileSync(tableFile, `${lines.join('\n')}\n`)
    }

    expect(rows).not.toHaveLength(0)
  })
})
