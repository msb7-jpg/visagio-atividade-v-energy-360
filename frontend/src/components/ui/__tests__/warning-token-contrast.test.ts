/// <reference types="node" />
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'

/** O Vitest zera os `.css` importados (inclusive com `?raw`), então os tokens são lidos direto do arquivo. */
const css = readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../index.css'), 'utf8')

const MIN_TEXT_CONTRAST = 4.5
/** O Badge e o Alert de aviso usam `bg-warning/15` com o texto na própria cor. */
const WARNING_TINT = 0.15
const SURFACES = ['card', 'background', 'muted', 'secondary', 'accent'] as const

type Rgb = readonly [number, number, number]

function tokensOf(selector: string): Record<string, string> {
  const themeBlock = css.split('}').find((block) => block.includes(`${selector} {`) && block.includes('--warning:')) ?? ''
  const entries = themeBlock
    .split(';')
    .map((declaration) => declaration.split(':').map((part) => part.trim()))
    .filter(([name, value]) => name.startsWith('--') && /^#[0-9A-Fa-f]{6}$/.test(value ?? ''))
    .map(([name, value]) => [name.slice(2), value])
  return Object.fromEntries(entries)
}

function hexToRgb(hex: string): Rgb {
  const channels = [1, 3, 5].map((start) => Number.parseInt(hex.slice(start, start + 2), 16))
  return [channels[0], channels[1], channels[2]]
}

function blend(top: Rgb, bottom: Rgb, topShare: number): Rgb {
  const mixed = top.map((channel, index) => channel * topShare + bottom[index] * (1 - topShare))
  return [mixed[0], mixed[1], mixed[2]]
}

function luminance(color: Rgb): number {
  const [red, green, blue] = color.map((channel) => {
    const unit = channel / 255
    return unit <= 0.03928 ? unit / 12.92 : ((unit + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue
}

function contrastRatio(first: Rgb, second: Rgb): number {
  const luminances = [luminance(first), luminance(second)]
  return (Math.max(...luminances) + 0.05) / (Math.min(...luminances) + 0.05)
}

describe.each([
  ['claro', ':root'],
  ['escuro', '.dark']
])('token --warning no tema %s', (_theme, selector) => {
  const tokens = tokensOf(selector)

  test.each(SURFACES)('o texto do selo de aviso passa no AA sobre a superfície %s', (surface) => {
    const warning = hexToRgb(tokens.warning)
    const tintedBackground = blend(warning, hexToRgb(tokens[surface]), WARNING_TINT)

    expect(contrastRatio(warning, tintedBackground)).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST)
  })
})
