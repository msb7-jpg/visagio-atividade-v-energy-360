export type MonthEdge = 'inicio' | 'fim'

const MONTH_LENGTH = 7

/**
 * Converte uma competência `YYYY-MM` em data `YYYY-MM-DD` para o campo de data:
 * primeiro dia do mês para o início do período e último dia para o fim.
 *
 * @param month - Competência no formato da API.
 * @param edge - `inicio` usa o dia 1; `fim` usa o último dia do mês.
 * @returns Data ISO para o `value` do campo `date`.
 */
export function monthToDate(month: string, edge: MonthEdge): string {
  if (edge === 'inicio') {
    return `${month}-01`
  }
  const [year, monthNumber] = month.split('-').map(Number)
  const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate()
  return `${month}-${String(lastDay).padStart(2, '0')}`
}

/**
 * Reduz a data escolhida no campo à competência do mês (qualquer dia do mês vale).
 *
 * @param date - Data ISO `YYYY-MM-DD` devolvida pelo campo `date`.
 * @returns Competência `YYYY-MM`, ou texto vazio se o campo foi limpo.
 */
export function dateToMonth(date: string): string {
  return date.slice(0, MONTH_LENGTH)
}
