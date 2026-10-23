import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { InspectionStatusBadge } from '@/features/loss_management/components/InspectionStatusBadge'
import type { InspectionOrder } from '@/features/loss_management/types/lossTypes'
import { formatDate, formatKwh } from '@/features/loss_management/utils/lossFormatters'

export type OrderActionKind = 'dispatch' | 'result' | 'cancel'

interface InspectionOrdersTableProps {
  orders: InspectionOrder[]
  onAction: (kind: OrderActionKind, order: InspectionOrder) => void
}

/**
 * Resume o resultado de campo de uma ordem concluída.
 *
 * @param order - Ordem de inspeção.
 * @returns Texto do resultado, ou travessão se ainda não houver.
 */
function describeFieldResult(order: InspectionOrder): string {
  if (order.irregularidade_constatada === null) {
    return '—'
  }
  if (!order.irregularidade_constatada) {
    return 'Sem irregularidade'
  }
  const recoveredText = order.kwh_recuperado === null ? '' : ` · ${formatKwh(order.kwh_recuperado)}`
  return `${order.tipo_irregularidade ?? 'Irregular'}${recoveredText}`
}

interface OrderActionsProps {
  order: InspectionOrder
  onAction: InspectionOrdersTableProps['onAction']
}

/**
 * Ações disponíveis conforme o status: enviar/registrar e cancelar (apenas ordens ativas).
 *
 * @param props - Ordem e callback de ação.
 * @returns Botões de ação da linha, ou nada para ordens encerradas.
 */
function OrderActions({ order, onAction }: OrderActionsProps) {
  const isActive = order.status === 'gerada' || order.status === 'pendente'
  if (!isActive) {
    return null
  }
  const isGenerated = order.status === 'gerada'
  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" onClick={() => onAction(isGenerated ? 'dispatch' : 'result', order)}>
        {isGenerated ? 'Enviar para campo' : 'Registrar resultado'}
      </Button>
      <Button size="sm" variant="ghost" onClick={() => onAction('cancel', order)}>Cancelar ordem</Button>
    </div>
  )
}

/**
 * Ordens de inspeção com status, resultado de campo e ações.
 *
 * @param props - Ordens e callback de ação.
 * @returns Tabela de ordens de inspeção.
 */
export function InspectionOrdersTable({ orders, onAction }: InspectionOrdersTableProps) {
  return (
    <Table aria-label="Ordens de inspeção">
      <TableHeader>
        <TableRow>
          <TableHead>OS</TableHead>
          <TableHead>UC</TableHead>
          <TableHead>Aberta em</TableHead>
          <TableHead>Fiscal</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Resultado de campo</TableHead>
          <TableHead>Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => (
          <TableRow key={order.id_inspecao}>
            <TableCell><span className="font-mono">#{order.id_inspecao}</span></TableCell>
            <TableCell><span className="font-mono">{order.id_uc}</span></TableCell>
            <TableCell>{formatDate(order.criado_em)}</TableCell>
            <TableCell>{order.fiscal_responsavel ?? '—'}</TableCell>
            <TableCell>
              <InspectionStatusBadge status={order.status} />
            </TableCell>
            <TableCell>{describeFieldResult(order)}</TableCell>
            <TableCell>
              <OrderActions order={order} onAction={onAction} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
