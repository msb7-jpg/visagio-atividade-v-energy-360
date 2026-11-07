import type { MatcherFunction } from '@testing-library/react'

const normalize = (text: string | null | undefined) => (text ?? '').replace(/\s+/g, ' ').trim()

/**
 * Busca por texto que o componente quebra em várias partes (ex.: "R$" e "mi" menores que o número).
 * Casa o elemento mais interno cujo texto completo, com espaços normalizados, é o procurado.
 *
 * @param expected - Texto exato ou expressão regular.
 * @returns Função de busca para `getByText`.
 */
export function fullText(expected: string | RegExp): MatcherFunction {
  const matches = (text: string) => (typeof expected === 'string' ? text === expected : expected.test(text))
  return (_content, element) => {
    if (!element || !matches(normalize(element.textContent))) return false
    return Array.from(element.children).every((child) => !matches(normalize(child.textContent)))
  }
}
