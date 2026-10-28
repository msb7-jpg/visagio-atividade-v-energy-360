import type {
  BreakdownControls,
  NeighborhoodRef,
  PeriodWindow,
  RevenueQuery
} from '@/features/revenue/types/revenueTypes'

/**
 * Janelas padrão do case: primeiro ano da base (jul/2022 a jun/2023) contra os últimos 12 meses (jul/2025 a jun/2026).
 * São as mesmas janelas do diagnóstico da receita e da tela do diretor.
 */
export const DEFAULT_REVENUE_QUERY: RevenueQuery = {
  base: { inicio: '2022-07', fim: '2023-06' },
  atual: { inicio: '2025-07', fim: '2026-06' },
  filters: {}
}

/** Ranking inicial: bairros, maior perda por efeito-volume primeiro. */
export const DEFAULT_BREAKDOWN_CONTROLS: BreakdownControls = {
  nivel: 'bairro',
  ordenar_por: 'efeito_volume_rs',
  ordem: 'asc',
  page: 1,
  page_size: 10
}

/** Meses mostrados na gaveta de histórico do bairro. */
export const HISTORY_MONTHS = 24

/**
 * Converte a seleção da tela nos query params da API; filtros vazios não são enviados.
 *
 * @param query - Janelas e recortes escolhidos.
 * @returns Parâmetros no formato esperado por `/revenue/*`.
 */
export function toApiParams(query: RevenueQuery): Record<string, string> {
  const windowParams = {
    base_inicio: query.base.inicio,
    base_fim: query.base.fim,
    atual_inicio: query.atual.inicio,
    atual_fim: query.atual.fim
  }
  const filledFilters = Object.entries(query.filters).filter(([, filterValue]) => Boolean(filterValue?.trim()))
  return { ...windowParams, ...Object.fromEntries(filledFilters) }
}

/**
 * Junta os parâmetros comuns com nível, ordenação e página do ranking.
 *
 * @param query - Janelas e recortes escolhidos.
 * @param controls - Nível, ordenação e página do ranking.
 * @returns Parâmetros de `GET /revenue/breakdown`.
 */
export function toBreakdownParams(query: RevenueQuery, controls: BreakdownControls): Record<string, string | number> {
  return { ...toApiParams(query), ...controls }
}

/**
 * Monta os parâmetros do histórico mensal do bairro até o fim da janela atual.
 *
 * @param query - Janelas e recortes escolhidos (só a classe de consumo é repassada).
 * @param neighborhood - Município e bairro escolhidos no ranking.
 * @returns Parâmetros de `GET /revenue/history`.
 */
export function toHistoryParams(query: RevenueQuery, neighborhood: NeighborhoodRef): Record<string, string | number> {
  const classe = query.filters.classe_consumo?.trim()
  return {
    municipio: neighborhood.municipio,
    bairro: neighborhood.bairro,
    competencia_fim: query.atual.fim,
    meses: HISTORY_MONTHS,
    ...(classe ? { classe_consumo: classe } : {})
  }
}

function isReversed(window: PeriodWindow): boolean {
  return window.inicio > window.fim
}

/**
 * Valida as janelas antes de chamar a API (mesmas regras do backend), evitando erro 400 desnecessário.
 *
 * @param query - Janelas e recortes escolhidos.
 * @returns Mensagem para o usuário ou `null` quando as janelas são válidas.
 */
export function validateRevenueQuery(query: RevenueQuery): string | null {
  if (isReversed(query.base) || isReversed(query.atual)) {
    return 'O mês inicial de cada período não pode ser posterior ao mês final.'
  }
  if (query.base.fim >= query.atual.inicio) {
    return 'O período base precisa terminar antes de o período de comparação começar.'
  }
  return null
}
