export const PAGE_SIZE = 15

/**
 * Fatia uma lista na página pedida, limitando a página ao intervalo válido.
 *
 * @param list - Lista completa, já ordenada.
 * @param page - Página desejada, a partir de 1.
 * @param setPage - Atualiza a página escolhida.
 * @returns Itens da página, total, total de páginas, página efetiva e o setter.
 */
export function paginate<T>(list: T[], page: number, setPage: (page: number) => void) {
  const totalPages = Math.max(Math.ceil(list.length / PAGE_SIZE), 1)
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * PAGE_SIZE
  return { items: list.slice(start, start + PAGE_SIZE), total: list.length, totalPages, page: currentPage, setPage }
}
