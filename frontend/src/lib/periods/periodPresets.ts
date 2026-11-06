/** Janela de competências `YYYY-MM`, do primeiro ao último mês (inclusive). */
export interface MonthWindow {
  inicio: string
  fim: string
}

/** O período analisado e o período com que ele é comparado. */
export interface ComparedWindows {
  base: MonthWindow
  atual: MonthWindow
}

export type ComparisonId = 'case' | 'yoy' | 'previous'

const MONTHS_PER_YEAR = 12
const MONTH_NAMES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

/** Primeiro ano da base, a janela da pergunta do diretor no case. */
export const CASE_BASE: MonthWindow = { inicio: '2022-07', fim: '2023-06' }
export const CUSTOM = 'custom'

const toIndex = (competencia: string) => {
  const [year, month] = competencia.split('-').map(Number)
  return year * MONTHS_PER_YEAR + (month - 1)
}

const fromIndex = (index: number) =>
  `${Math.floor(index / MONTHS_PER_YEAR)}-${String((index % MONTHS_PER_YEAR) + 1).padStart(2, '0')}`

/**
 * Soma meses a uma competência.
 *
 * @param competencia - Competência `YYYY-MM`.
 * @param delta - Meses a somar (negativo volta no tempo).
 * @returns Nova competência `YYYY-MM`.
 */
export function shiftMonth(competencia: string, delta: number): string {
  return fromIndex(toIndex(competencia) + delta)
}

/**
 * Formata a competência como mês abreviado e ano ("jul/2025").
 *
 * @param competencia - Competência `YYYY-MM`.
 * @returns Texto curto do mês.
 */
export function formatMonth(competencia: string): string {
  const [year, month] = competencia.split('-')
  return `${MONTH_NAMES[Number(month) - 1]}/${year}`
}

/**
 * Descreve a janela para leitura ("jul/2025 a jun/2026").
 *
 * @param window - Janela de competências.
 * @returns Texto do primeiro ao último mês.
 */
export function describeMonths(window: MonthWindow): string {
  return `${formatMonth(window.inicio)} a ${formatMonth(window.fim)}`
}

const monthCount = (window: MonthWindow) => toIndex(window.fim) - toIndex(window.inicio) + 1

const sameWindow = (left: MonthWindow, right: MonthWindow) => left.inicio === right.inicio && left.fim === right.fim

/**
 * Atalhos do período analisado: últimos 12, 6 e 3 meses até o último mês com dados e os anos completos.
 *
 * @param available - Primeiro e último mês com dados.
 * @returns Atalhos com rótulo e janela, do mais usado para o menos; só os que têm alguma comparação possível.
 */
export function periodPresets(available: MonthWindow): { id: string; label: string; atual: MonthWindow }[] {
  const latest = available.fim
  const recent = [12, 6, 3].map((months) => ({
    id: `last${months}`,
    label: `Últimos ${months} meses`,
    atual: { inicio: shiftMonth(latest, 1 - months), fim: latest }
  }))
  const lastYear = Number(latest.slice(0, 4)) - (latest.endsWith('-12') ? 0 : 1)
  const firstYear = Number(available.inicio.slice(0, 4)) + (available.inicio.endsWith('-01') ? 0 : 1)
  const years = Array.from({ length: Math.max(lastYear - firstYear + 1, 0) }, (_, offset) => lastYear - offset).map((year) => ({
    id: `year-${year}`,
    label: `Ano ${year}`,
    atual: { inicio: `${year}-01`, fim: `${year}-12` }
  }))
  return [...recent, ...years].filter((preset) => validComparisons(preset.atual, available).length > 0)
}

export const COMPARISONS: { id: ComparisonId; label: string }[] = [
  { id: 'case', label: `Primeiro ano da base (${describeMonths(CASE_BASE)})` },
  { id: 'yoy', label: 'Mesmo período do ano anterior' },
  { id: 'previous', label: 'Período imediatamente anterior' }
]

/**
 * Janela base para a comparação escolhida.
 *
 * @param comparison - Primeiro ano da base, mesmo período do ano anterior ou período imediatamente anterior.
 * @param atual - Período analisado.
 * @returns Janela base com o mesmo número de meses (exceto a do case, que é fixa).
 */
export function baseFor(comparison: ComparisonId, atual: MonthWindow): MonthWindow {
  if (comparison === 'case') return CASE_BASE
  const shift = comparison === 'yoy' ? -MONTHS_PER_YEAR : -monthCount(atual)
  return { inicio: shiftMonth(atual.inicio, shift), fim: shiftMonth(atual.fim, shift) }
}

/**
 * Comparações possíveis para o período: a base precisa caber nos meses com dados e terminar antes do período.
 *
 * @param atual - Período analisado.
 * @param available - Primeiro e último mês com dados.
 * @returns Identificadores das comparações válidas, na ordem do seletor.
 */
export function validComparisons(atual: MonthWindow, available: MonthWindow): ComparisonId[] {
  return COMPARISONS.map((option) => option.id).filter((id) => {
    const base = baseFor(id, atual)
    return base.inicio >= available.inicio && base.fim < atual.inicio
  })
}

/**
 * Reconhece quais atalhos produzem as janelas em uso, para mostrar a escolha nos seletores.
 *
 * @param windows - Janelas em uso.
 * @param available - Primeiro e último mês com dados.
 * @returns O atalho do período e a comparação, ou `custom` quando as datas foram escolhidas à mão.
 */
export function detectSelection(windows: ComparedWindows, available: MonthWindow): { preset: string; comparison: string } {
  const preset = periodPresets(available).find((option) => sameWindow(option.atual, windows.atual))?.id ?? CUSTOM
  const comparison = COMPARISONS.find((option) => sameWindow(baseFor(option.id, windows.atual), windows.base))?.id ?? CUSTOM
  return { preset, comparison }
}
