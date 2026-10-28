// O banco guarda município, classe e tipo em maiúsculas e sem acento; a tela restaura os acentos conhecidos.
const ACCENTED_WORDS: Record<string, string> = {
  aracoiaba: 'Araçoiaba',
  itamaraca: 'Itamaracá',
  jaboatao: 'Jaboatão',
  lourenco: 'Lourenço',
  sao: 'São',
  publico: 'Público',
  ligacao: 'Ligação'
}

const LOWERCASE_CONNECTORS = new Set(['de', 'da', 'do', 'das', 'dos', 'e'])

const capitalize = (word: string): string => word.charAt(0).toUpperCase() + word.slice(1)

function restoreWord(lowerWord: string): string {
  return ACCENTED_WORDS[lowerWord] ?? lowerWord
}

/**
 * Formata nome de lugar ou categoria: iniciais maiúsculas, conectivos minúsculos e acentos restaurados.
 *
 * @param rawName - Texto do banco, como "JABOATAO DOS GUARARAPES" ou "PODER PUBLICO".
 * @returns Texto como "Jaboatão dos Guararapes" ou "Poder Público".
 */
export function formatPlaceName(rawName: string): string {
  return rawName
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((lowerWord, position) =>
      position > 0 && LOWERCASE_CONNECTORS.has(lowerWord) ? lowerWord : capitalize(restoreWord(lowerWord))
    )
    .join(' ')
}

/**
 * Formata o tipo de irregularidade em caixa de frase, com acentos restaurados.
 *
 * @param rawType - Texto do banco, como "LIGACAO CLANDESTINA" ou "BY-PASS".
 * @returns Texto como "Ligação clandestina" ou "By-pass".
 */
export function formatIrregularityType(rawType: string): string {
  const restoredText = rawType
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map(restoreWord)
    .join(' ')
  return capitalize(restoredText)
}
