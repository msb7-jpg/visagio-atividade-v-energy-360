import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { OrderCardActions } from '@/features/loss_management/components/OrderCardActions'
import { useCanWriteLosses } from '@/features/loss_management/hooks/useCanWriteLosses'
import type { InspectionOrder } from '@/features/loss_management/types/lossTypes'
import { describeCancellationOutcome, describeCancellationReason } from '@/features/loss_management/utils/cancellationReasons'
import { formatDate, formatKwh } from '@/features/loss_management/utils/lossFormatters'
import { formatPlaceName } from '@/features/loss_management/utils/textFormat'
import { formatIsoDate } from '@/features/loss_management/utils/unitDetailFormat'
import {
  ACTIONS_BY_STATUS,
  formatOrderCode,
  summarizeFieldResult,
  type OrderActionKind
} from '@/features/loss_management/utils/orderBoard'

interface OrderCardProps {
  order: InspectionOrder
  onAction: (kind: OrderActionKind, order: InspectionOrder) => void
}

/**
 * Texto da faixa de cancelamento: motivo da lista, observação digitada e o que houve com a UC na fila.
 *
 * @param order - Ordem de inspeção.
 * @returns Texto como "Ordem duplicada · UC voltou à fila na hora", ou null se a ordem não registrou nada disso.
 */
function describeCancellation(order: InspectionOrder): string | null {
  const reason = order.motivo_cancelamento
  const parts = [
    reason ? describeCancellationReason(reason) : null,
    order.justificativa_cancelamento,
    reason ? describeCancellationOutcome(reason, order.atualizado_em) : null
  ].filter((part): part is string => Boolean(part))
  return parts.length > 0 ? parts.join(' · ') : null
}

/**
 * Linha de apoio do cartão: energia a recuperar (ordem aberta) e o inspetor, ou "sem inspetor" enquanto não há um.
 *
 * @param order - Ordem de inspeção.
 * @returns Texto como "189 kWh a recuperar · sem inspetor"; null em ordem concluída sem inspetor registrado.
 */
function describeSupportLine(order: InspectionOrder): string | null {
  const isOpen = order.status === 'gerada' || order.status === 'pendente'
  const inspector = order.inspetor ?? order.fiscal_responsavel
  const recoverable = isOpen && order.kwh_estimado > 0 ? `${formatKwh(order.kwh_estimado)} a recuperar` : null
  const inspectorText = inspector ?? (order.status === 'concluida' ? null : 'sem inspetor')
  const parts = [recoverable, inspectorText].filter((part): part is string => part !== null)
  return parts.length > 0 ? parts.join(' · ') : null
}

/**
 * Cartão de uma ordem: código com a data, UC com o bairro, linha de apoio, resultado de campo,
 * motivo do cancelamento e as ações da etapa.
 *
 * @param props - Ordem e callback das ações (despachar, registrar resultado, cancelar).
 * @returns Item de lista com o cartão da ordem.
 */
export function OrderCard({ order, onAction }: OrderCardProps) {
  const resultSummary = summarizeFieldResult(order)
  const cancellationText = describeCancellation(order)
  const supportLine = describeSupportLine(order)
  const canWrite = useCanWriteLosses()
  const actions = canWrite ? ACTIONS_BY_STATUS[order.status] : []
  const placeName = order.bairro ? formatPlaceName(order.bairro) : null

  return (
    <li>
      <Card className="flex flex-col gap-1.5 p-3">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-foreground text-sm font-bold tabular-nums">{formatOrderCode(order)}</span>
          <time dateTime={order.criado_em} className="text-muted-foreground text-xs tabular-nums">
            {formatDate(order.criado_em)}
          </time>
        </div>
        <p className="text-foreground text-sm">
          <span className="tabular-nums">{order.id_uc}</span>
          {placeName ? ` · ${placeName}` : ''}
        </p>
        {supportLine ? <p className="text-muted-foreground text-xs tabular-nums">{supportLine}</p> : null}
        {resultSummary ? (
          <Badge variant={resultSummary.tone} className="h-auto self-start whitespace-normal">{resultSummary.text}</Badge>
        ) : null}
        {order.data_inspecao ? (
          <p className="text-muted-foreground text-xs tabular-nums">Inspeção em {formatIsoDate(order.data_inspecao)}</p>
        ) : null}
        {cancellationText ? (
          <p className="text-muted-foreground border-border rounded-md border p-2 text-xs">
            Cancelada: {cancellationText}
          </p>
        ) : null}
        <OrderCardActions order={order} actions={actions} onAction={onAction} />
      </Card>
    </li>
  )
}
