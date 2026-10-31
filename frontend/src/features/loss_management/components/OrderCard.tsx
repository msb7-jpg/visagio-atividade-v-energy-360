import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { OrderCardActions } from '@/features/loss_management/components/OrderCardActions'
import { useCanWriteLosses } from '@/features/loss_management/hooks/useCanWriteLosses'
import type { InspectionOrder } from '@/features/loss_management/types/lossTypes'
import { describeCancellationReason } from '@/features/loss_management/utils/cancellationReasons'
import { formatDate, formatKwh } from '@/features/loss_management/utils/lossFormatters'
import { formatPlaceName } from '@/features/loss_management/utils/textFormat'
import { formatIsoDate } from '@/features/loss_management/utils/unitDetailFormat'
import {
  ACTIONS_BY_STATUS,
  formatOrderAge,
  formatOrderCode,
  summarizeFieldResult,
  type OrderActionKind
} from '@/features/loss_management/utils/orderBoard'

interface OrderCardProps {
  order: InspectionOrder
  onAction: (kind: OrderActionKind, order: InspectionOrder) => void
}

/**
 * Texto da faixa de cancelamento: motivo da lista e, se houver, a observação digitada.
 *
 * @param order - Ordem de inspeção.
 * @returns Texto como "Ordem duplicada · já havia outra aberta", ou null se a ordem não registrou nenhum dos dois.
 */
function describeCancellation(order: InspectionOrder): string | null {
  const reasonLabel = order.motivo_cancelamento ? describeCancellationReason(order.motivo_cancelamento) : null
  const parts = [reasonLabel, order.justificativa_cancelamento].filter((part): part is string => Boolean(part))
  return parts.length > 0 ? parts.join(' · ') : null
}

/**
 * Linha de território do cartão: bairro e município da UC, ou "—" quando o cadastro não os traz.
 *
 * @param order - Ordem de inspeção.
 * @returns Texto como "Boa Viagem · Recife"; só uma parte presente mostra "—" no lugar da outra; nenhuma, só "—".
 */
function describeLocation(order: InspectionOrder): string {
  if (!order.bairro && !order.municipio) return '—'
  const district = order.bairro ? formatPlaceName(order.bairro) : '—'
  const municipality = order.municipio ? formatPlaceName(order.municipio) : '—'
  return `${district} · ${municipality}`
}

/**
 * Cartão enxuto de uma ordem: código com a idade, UC com a energia a recuperar, território com o inspetor
 * (só quando já há um), resultado de campo e as ações da etapa.
 *
 * @param props - Ordem e callback das ações (enviar a campo, registrar resultado, cancelar).
 * @returns Item de lista com o cartão da ordem.
 */
export function OrderCard({ order, onAction }: OrderCardProps) {
  const resultSummary = summarizeFieldResult(order)
  const cancellationText = describeCancellation(order)
  const canWrite = useCanWriteLosses()
  const actions = canWrite ? ACTIONS_BY_STATUS[order.status] : []
  const isOpen = order.status === 'gerada' || order.status === 'pendente'
  const inspector = order.inspetor ?? order.fiscal_responsavel

  return (
    <li>
      <Card className="flex flex-col gap-1 p-3">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-foreground text-sm font-bold tabular-nums">{formatOrderCode(order)}</span>
          <time dateTime={order.criado_em} title={formatDate(order.criado_em)} className="text-muted-foreground text-xs tabular-nums">
            {isOpen ? formatOrderAge(order.criado_em) : formatDate(order.criado_em)}
          </time>
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-foreground text-sm tabular-nums">{order.id_uc}</p>
          {isOpen && order.kwh_estimado > 0 ? (
            <p className="text-muted-foreground text-xs tabular-nums">{formatKwh(order.kwh_estimado)} a recuperar</p>
          ) : null}
        </div>
        <div className="text-muted-foreground flex flex-wrap items-baseline justify-between gap-x-2 text-xs">
          <p>{describeLocation(order)}</p>
          {inspector ? <p>{inspector}</p> : null}
        </div>
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
