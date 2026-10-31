/// <reference types="node" />
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export type Rgb = readonly [number, number, number]

/** O Vitest zera os `.css` importados (inclusive com `?raw`), então os tokens são lidos direto do arquivo. */
const css = readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../index.css'), 'utf8')

/**
 * Tokens de cor (valores `#RRGGBB`) de um tema do `index.css`.
 *
 * @param selector - `:root` para o claro ou `.dark` para o escuro.
 * @returns Mapa nome do token (sem `--`) para o valor hexadecimal.
 */
export function readTokens(selector: ':root' | '.dark'): Record<string, string> {
  const themeBlock = css.split('}').find((block) => block.includes(`${selector} {`) && block.includes('--warning:')) ?? ''
  const entries = themeBlock
    .split(';')
    .map((declaration) => declaration.split(':').map((part) => part.trim()))
    .filter(([name, value]) => name.startsWith('--') && /^#[0-9A-Fa-f]{6}$/.test(value ?? ''))
    .map(([name, value]) => [name.slice(2), value])
  return Object.fromEntries(entries)
}

/**
 * Converte `#RRGGBB` em canais 0-255.
 *
 * @param hex - Cor hexadecimal de 6 dígitos.
 * @returns Canais vermelho, verde e azul.
 */
export function hexToRgb(hex: string): Rgb {
  const channels = [1, 3, 5].map((start) => Number.parseInt(hex.slice(start, start + 2), 16))
  return [channels[0], channels[1], channels[2]]
}

/**
 * Mistura duas cores no espaço sRGB, como o `color-mix(in srgb, top N%, bottom)` do CSS.
 *
 * @param top - Cor de cima.
 * @param bottom - Cor de baixo.
 * @param topShare - Parte da cor de cima, de 0 a 1.
 * @returns Cor resultante.
 */
export function blend(top: Rgb, bottom: Rgb, topShare: number): Rgb {
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

/**
 * Razão de contraste WCAG entre duas cores.
 *
 * @param first - Uma das cores.
 * @param second - A outra cor.
 * @returns Razão de 1 a 21.
 */
export function contrastRatio(first: Rgb, second: Rgb): number {
  const luminances = [luminance(first), luminance(second)]
  return (Math.max(...luminances) + 0.05) / (Math.min(...luminances) + 0.05)
}
