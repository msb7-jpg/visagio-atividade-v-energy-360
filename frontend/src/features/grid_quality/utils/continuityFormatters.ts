const INTEGER_FORMAT = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 })
const PERCENT_FORMAT = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1, minimumFractionDigits: 1 })

/**
 * Formata um número inteiro no padrão pt-BR.
 *
 * @param value - Valor numérico.
 * @returns Texto com separador de milhar.
 */
export function formatInteger(value: number): string {
  return INTEGER_FORMAT.format(value)
}

/**
 * Formata um percentual com uma casa decimal.
 *
 * @param value - Percentual de 0 a 100.
 * @returns Texto como `62,1%`.
 */
export function formatPercent(value: number): string {
  return `${PERCENT_FORMAT.format(value)}%`
}

/**
 * Formata uma duração em horas como `2h38`.
 *
 * @param hours - Duração em horas decimais.
 * @returns Texto com horas e minutos.
 */
export function formatHoursMinutes(hours: number): string {
  const totalMinutes = Math.round(hours * 60)
  return `${Math.floor(totalMinutes / 60)}h${String(totalMinutes % 60).padStart(2, '0')}`
}
