const DECIMAL_FORMAT = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 })

/**
 * Formata um número com até duas casas decimais; ausente vira travessão.
 *
 * @param value - Valor numérico ou nulo.
 * @returns Texto no padrão pt-BR.
 */
export function formatDecimal(value: number | null): string {
  return value === null ? '—' : DECIMAL_FORMAT.format(value)
}

/**
 * Converte a competência `YYYY-MM` em `MM/YYYY`.
 *
 * @param competencia - Competência no padrão da API.
 * @returns Texto para eixos e títulos.
 */
export function formatCompetencia(competencia: string): string {
  const [year, month] = competencia.split('-')
  return `${month}/${year}`
}
