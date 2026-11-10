import type { FeederHistoryPoint } from '@/features/grid_quality/types/qualityTypes'
import { formatInteger } from '@/features/grid_quality/utils/continuityFormatters'
import { displayName } from '@/lib/geo/placeName'

const MONTHS_PER_YEAR = 12

/** DEC de um ano civil do alimentador: o acumulado do último mês com dado, contra o limite anual. */
export interface FeederYear {
  year: string
  decHours: number
  limitHours: number | null
  /** Meses com dado no ano; menos de 12 quando a base começa ou termina no meio do ano. */
  months: number
}

/**
 * Fecha o DEC de cada ano civil a partir da série mensal: o acumulado zera em janeiro, então o valor do ano é o
 * acumulado do último mês com dado. Não recalcula nada, só lê o acumulado que a API já devolve.
 *
 * @param points - Série mensal em ordem de competência.
 * @returns Um item por ano, do mais antigo para o mais recente.
 */
export function yearlyDec(points: FeederHistoryPoint[]): FeederYear[] {
  const byYear = new Map<string, FeederHistoryPoint[]>()
  for (const point of points) {
    const year = point.competencia.slice(0, 4)
    byYear.set(year, [...(byYear.get(year) ?? []), point])
  }
  return [...byYear.entries()].map(([year, yearPoints]) => {
    const lastPoint = yearPoints[yearPoints.length - 1]
    return { year, decHours: lastPoint.dec_acumulado_ano_horas, limitHours: lastPoint.dec_limite_horas, months: yearPoints.length }
  })
}

/**
 * Indica se o ano tem menos de 12 meses de dado.
 *
 * @param feederYear - Ano fechado por `yearlyDec`.
 * @returns `true` para anos parciais.
 */
export function isPartialYear(feederYear: FeederYear): boolean {
  return feederYear.months < MONTHS_PER_YEAR
}

/**
 * Últimos meses da série, para o gráfico mensal.
 *
 * @param points - Série mensal em ordem de competência.
 * @param count - Quantidade de meses.
 * @returns Os `count` meses mais recentes, em ordem.
 */
export function lastMonths(points: FeederHistoryPoint[], count = MONTHS_PER_YEAR): FeederHistoryPoint[] {
  return points.slice(-count)
}

/**
 * Mês com mais horas sem energia.
 *
 * @param points - Meses considerados.
 * @returns O ponto de maior DEC do mês, ou `undefined` sem pontos.
 */
export function worstMonth(points: FeederHistoryPoint[]): FeederHistoryPoint | undefined {
  return points.reduce<FeederHistoryPoint | undefined>(
    (worst, point) => (worst === undefined || point.dec_apurado_horas > worst.dec_apurado_horas ? point : worst),
    undefined
  )
}

/**
 * Distância até o limite, para a frase curta sob a barra.
 *
 * @param value - Acumulado no ano.
 * @param limit - Limite anual de referência, ou nulo sem limite.
 * @returns Diferença positiva acima do limite, negativa abaixo; nula sem limite.
 */
export function gapToLimit(value: number, limit: number | null): number | null {
  return limit === null ? null : value - limit
}

/** Campos de cadastro que a linha do ranking e cada ponto do histórico têm em comum. */
type FeederRegistry = Pick<FeederHistoryPoint, 'conjunto_aneel' | 'ucs_atendidas' | 'criterio_limite'>

/**
 * Linha de identificação do alimentador sob o título do painel.
 *
 * @param registry - Linha do ranking ou o último ponto do histórico; ausente enquanto carrega.
 * @returns Texto como "Conjunto Jaboatao · 20 UCs atendidas", com "limite aproximado" quando o limite é a mediana da RMR.
 */
export function describeFeeder(registry: FeederRegistry | undefined): string {
  if (!registry) return 'Carregando os dados do alimentador'
  const parts = [
    registry.conjunto_aneel ? `Conjunto ${displayName(registry.conjunto_aneel)}` : null,
    registry.ucs_atendidas === null ? null : `${formatInteger(registry.ucs_atendidas)} UCs atendidas`,
    registry.criterio_limite === 'MEDIANA_RMR' ? 'limite aproximado' : null
  ]
  return parts.filter((part) => part !== null).join(' · ')
}
