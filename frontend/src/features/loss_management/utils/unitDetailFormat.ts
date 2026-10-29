const MONTH_ABBREVIATIONS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'] as const

/**
 * Formata uma competência para o eixo e o tooltip do gráfico.
 *
 * @param competencia - Competência no formato 'YYYY-MM'.
 * @returns Texto como "mai/2026".
 */
export function formatCompetenciaLabel(competencia: string): string {
  const [year, month] = competencia.split('-')
  return `${MONTH_ABBREVIATIONS[Number(month) - 1]}/${year}`
}

/**
 * Formata uma data sem hora (AAAA-MM-DD) como dd/mm/aaaa, sem passar por `Date` (que deslocaria o dia pelo fuso).
 *
 * @param isoDate - Data no formato 'YYYY-MM-DD'.
 * @returns Texto como "28/10/2026".
 */
export function formatIsoDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-')
  return `${day}/${month}/${year}`
}
