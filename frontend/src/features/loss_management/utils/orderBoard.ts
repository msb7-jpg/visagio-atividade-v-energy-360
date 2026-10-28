import type { StatusOf } from '@/components/ui/status-badge'
import type { InspectionOrder, InspectionStatus } from '@/features/loss_management/types/lossTypes'
import { formatKwh } from '@/features/loss_management/utils/lossFormatters'

export type BadgeTone = 'default' | 'secondary' | 'destructive' | 'warning' | 'success' | 'outline'

export interface BoardColumn {
  status: InspectionStatus
  label: string
  badge: StatusOf<'ordem'>
}

/**
 * Colunas do quadro, na ordem do fluxo. O backend chama "pendente" a ordem que já está em campo
 * e "gerada" a que ainda aguarda envio; o quadro usa os rótulos do fluxo de negócio.
 */
export const BOARD_COLUMNS: readonly BoardColumn[] = [
  { status: 'gerada', label: 'Pendente', badge: 'pendente' },
  { status: 'pendente', label: 'Em campo', badge: 'em_campo' },
  { status: 'concluida', label: 'Concluída', badge: 'concluida' },
  { status: 'cancelada', label: 'Cancelada', badge: 'cancelada' }
]

export type OrderActionKind = 'dispatch' | 'result' | 'cancel'

/** Ações de cada etapa (espelham as transições do servidor: gerada→pendente, pendente→concluida, gerada|pendente→cancelada). */
export const ACTIONS_BY_STATUS: Record<InspectionStatus, readonly OrderActionKind[]> = {
  gerada: ['dispatch', 'cancel'],
  pendente: ['result', 'cancel'],
  concluida: [],
  cancelada: []
}

export const ACTION_LABELS: Record<OrderActionKind, string> = {
  dispatch: 'Enviar a campo',
  result: 'Registrar resultado',
  cancel: 'Cancelar'
}

const ORDER_NUMBER_DIGITS = 4

/**
 * Agrupa as ordens por status, preservando a ordem recebida dentro de cada coluna.
 *
 * @param orders - Ordens da API.
 * @returns Ordens de cada status do quadro (coluna sem ordem fica com lista vazia).
 */
export function groupOrdersByStatus(orders: InspectionOrder[]): Record<InspectionStatus, InspectionOrder[]> {
  const grouped: Record<InspectionStatus, InspectionOrder[]> = { gerada: [], pendente: [], concluida: [], cancelada: [] }
  orders.forEach((order) => grouped[order.status].push(order))
  return grouped
}

/**
 * Monta o código de exibição da ordem no formato OI-AAAA-NNNN.
 *
 * @param order - Ordem de inspeção.
 * @returns Código como "OI-2026-0412" (ano de criação e id com 4 dígitos).
 */
export function formatOrderCode(order: InspectionOrder): string {
  const creationYear = order.criado_em.slice(0, 4)
  return `OI-${creationYear}-${String(order.id_inspecao).padStart(ORDER_NUMBER_DIGITS, '0')}`
}

export interface FieldResultSummary {
  text: string
  tone: BadgeTone
}

/**
 * Resume o resultado de campo para o selo do cartão.
 *
 * @param order - Ordem de inspeção.
 * @returns Texto e tom do selo, ou null enquanto não há resultado.
 */
export function summarizeFieldResult(order: InspectionOrder): FieldResultSummary | null {
  if (order.irregularidade_constatada === null) {
    return null
  }
  if (!order.irregularidade_constatada) {
    return { text: 'Sem irregularidade', tone: 'outline' }
  }
  const detailParts = [order.tipo_irregularidade, order.kwh_recuperado === null ? null : formatKwh(order.kwh_recuperado)]
  const details = detailParts.filter((part): part is string => part !== null && part !== '')
  return { text: ['Irregularidade confirmada', ...details].join(' · '), tone: 'success' }
}
