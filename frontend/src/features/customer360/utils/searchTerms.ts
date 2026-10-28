const UC_PREFIX = 'UC'
const MIN_SEARCH_LENGTH = 3
const SEPARATORS = /[\s\-_./]/g

/**
 * Remove espaços e separadores e coloca em caixa alta (mesma regra do backend).
 *
 * @param typedText - Texto digitado, ex: ` uc-100 004 `.
 * @returns Texto compacto, ex: `UC100004`.
 */
function compactTerm(typedText: string): string {
  return typedText.replace(SEPARATORS, '').toUpperCase()
}

/**
 * Converte o número digitado no formato do cadastro, aceitando só os dígitos.
 *
 * @param typedText - Número como digitado, ex: `100004`, `uc 100004` ou `UC-100004`.
 * @returns Identificador no formato do cadastro, ex: `UC100004`.
 */
export function normalizeIdUc(typedText: string): string {
  const compact = compactTerm(typedText)
  return /^\d+$/.test(compact) ? `${UC_PREFIX}${compact}` : compact
}

/**
 * Indica se o texto já tem tamanho para pedir sugestões ao backend.
 *
 * @param typedText - Texto digitado.
 * @returns Verdadeiro com pelo menos 3 caracteres úteis.
 */
export function isSearchable(typedText: string): boolean {
  return compactTerm(typedText).length >= MIN_SEARCH_LENGTH
}

/**
 * Prepara o texto para pedir sugestões, mantendo os espaços internos que separam as palavras de um nome.
 *
 * @param typedText - Texto digitado, ex: `  maria   da silva `.
 * @returns Texto sem espaços repetidos nem nas pontas, ex: `maria da silva`.
 */
export function normalizeSearchText(typedText: string): string {
  return typedText.replace(/\s+/g, ' ').trim()
}
