import type { SuspiciousUnitsFilter } from '@/features/loss_management/types/lossTypes'

/**
 * Diz se algum filtro da fila está aplicado.
 *
 * @param filters - Filtros atuais da fila.
 * @returns True quando motivo, município, bairro ou classe estão definidos.
 */
export function hasActiveFilters(filters: SuspiciousUnitsFilter): boolean {
  return Object.values(filters).some((filterValue) => filterValue !== undefined && filterValue !== '')
}
