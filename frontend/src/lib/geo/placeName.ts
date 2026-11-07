const CONNECTORS = new Set(['de', 'da', 'do', 'das', 'dos', 'e'])

/**
 * Nome do município para leitura: "JABOATAO DOS GUARARAPES" vira "Jaboatao dos Guararapes".
 *
 * @param name - Nome em caixa alta, como vem da base.
 * @returns Nome com iniciais maiúsculas e conectivos em minúsculas.
 */
export function displayName(name: string): string {
  return name
    .toLowerCase()
    .split(' ')
    .map((word, index) => (index > 0 && CONNECTORS.has(word) ? word : word.charAt(0).toUpperCase() + word.slice(1)))
    .join(' ')
}
