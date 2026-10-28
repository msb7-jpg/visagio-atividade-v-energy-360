import type { DashboardPeriods, PeriodWindow } from '@/features/executive_dashboard/types/executiveDashboardTypes'

const COMPETENCIA_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/
const MONTH_NAMES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
const MONTHS_PER_YEAR = 12

/** Pergunta do diretor no case: primeiro ano da base contra os últimos 12 meses (mesmo padrão da API). */
export const DEFAULT_PERIODS: DashboardPeriods = {
  base: { competencia_inicio: '2022-07', competencia_fim: '2023-06' },
  atual: { competencia_inicio: '2025-07', competencia_fim: '2026-06' }
}

export const PERIOD_PARAMS = {
  baseInicio: 'base_inicio',
  baseFim: 'base_fim',
  atualInicio: 'atual_inicio',
  atualFim: 'atual_fim'
} as const

function validOr(value: string | null, fallback: string): string {
  return value !== null && COMPETENCIA_PATTERN.test(value) ? value : fallback
}

/**
 * Lê as janelas do endereço da página; parâmetro ausente ou malformado usa o padrão do case.
 *
 * @param searchParams - Parâmetros da URL.
 * @returns Janela base e janela atual.
 */
export function periodsFromParams(searchParams: URLSearchParams): DashboardPeriods {
  return {
    base: {
      competencia_inicio: validOr(searchParams.get(PERIOD_PARAMS.baseInicio), DEFAULT_PERIODS.base.competencia_inicio),
      competencia_fim: validOr(searchParams.get(PERIOD_PARAMS.baseFim), DEFAULT_PERIODS.base.competencia_fim)
    },
    atual: {
      competencia_inicio: validOr(searchParams.get(PERIOD_PARAMS.atualInicio), DEFAULT_PERIODS.atual.competencia_inicio),
      competencia_fim: validOr(searchParams.get(PERIOD_PARAMS.atualFim), DEFAULT_PERIODS.atual.competencia_fim)
    }
  }
}

/**
 * Converte as janelas nos parâmetros da URL.
 *
 * @param periods - Janela base e janela atual.
 * @returns Parâmetros com os quatro limites.
 */
export function periodsToParams(periods: DashboardPeriods): Record<string, string> {
  return {
    [PERIOD_PARAMS.baseInicio]: periods.base.competencia_inicio,
    [PERIOD_PARAMS.baseFim]: periods.base.competencia_fim,
    [PERIOD_PARAMS.atualInicio]: periods.atual.competencia_inicio,
    [PERIOD_PARAMS.atualFim]: periods.atual.competencia_fim
  }
}

/**
 * Indica se as janelas são as do padrão do case.
 *
 * @param periods - Janelas em uso.
 * @returns `true` quando os quatro limites coincidem com `DEFAULT_PERIODS`.
 */
export function isDefaultPeriods(periods: DashboardPeriods): boolean {
  const defaults = periodsToParams(DEFAULT_PERIODS)
  return Object.entries(periodsToParams(periods)).every(([paramName, paramValue]) => defaults[paramName] === paramValue)
}

/**
 * Lista as competências entre dois limites, em ordem.
 *
 * @param window - Primeira e última competência.
 * @returns Competências `YYYY-MM`; vazia se o início é posterior ao fim.
 */
export function competenciasOf(window: PeriodWindow): string[] {
  const [startYear, startMonth] = window.competencia_inicio.split('-').map(Number)
  const [endYear, endMonth] = window.competencia_fim.split('-').map(Number)
  const total = (endYear - startYear) * MONTHS_PER_YEAR + (endMonth - startMonth) + 1
  return Array.from({ length: Math.max(total, 0) }, (_, offset) => {
    const monthIndex = startMonth - 1 + offset
    const year = startYear + Math.floor(monthIndex / MONTHS_PER_YEAR)
    return `${year}-${String((monthIndex % MONTHS_PER_YEAR) + 1).padStart(2, '0')}`
  })
}

/**
 * Formata a competência como mês abreviado e ano.
 *
 * @param competencia - Competência `YYYY-MM`.
 * @returns Texto como "jul/2025".
 */
export function formatMonth(competencia: string): string {
  const [year, month] = competencia.split('-')
  return `${MONTH_NAMES[Number(month) - 1]}/${year}`
}

/**
 * Descreve uma janela para leitura humana.
 *
 * @param window - Janela de competências.
 * @returns Texto como "jul/2022 a jun/2023".
 */
export function describeWindow(window: PeriodWindow): string {
  return `${formatMonth(window.competencia_inicio)} a ${formatMonth(window.competencia_fim)}`
}

/**
 * Valida as janelas antes de consultar a API, com a mesma regra do backend.
 *
 * @param periods - Janelas escolhidas.
 * @returns Mensagem do problema, ou `null` quando as janelas são válidas.
 */
export function periodsProblem(periods: DashboardPeriods): string | null {
  const windows = [periods.base, periods.atual]
  if (windows.some((window) => window.competencia_inicio > window.competencia_fim)) {
    return 'O início de cada período deve vir antes do fim.'
  }
  if (periods.base.competencia_fim >= periods.atual.competencia_inicio) {
    return 'O período base deve terminar antes do início do período atual.'
  }
  return null
}
