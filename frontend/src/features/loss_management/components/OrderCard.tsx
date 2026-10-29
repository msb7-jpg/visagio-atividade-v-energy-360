import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useCanWriteLosses } from '@/features/loss_management/hooks/useCanWriteLosses'
import type { InspectionOrder } from '@/features/loss_management/types/lossTypes'
import { describeCancellationReason } from '@/features/loss_management/utils/cancellationReasons'
import { formatDate } from '@/features/loss_management/utils/lossFormatters'
import { formatPlaceName } from '@/features/loss_management/utils/textFormat'
import { formatIsoDate } from '@/features/loss_management/utils/unitDetailFormat'
import {
  ACTION_LABELS,
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
 * Linha cinza do cartão: inspetor responsável ou aviso de que ainda não há.
 *
 * @param order - Ordem de inspeção.
 * @returns Texto de apoio do cartão.
 */
function describeInspector(order: InspectionOrder): string {
  return order.inspetor ?? order.fiscal_responsavel ?? 'sem inspetor'
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
 * Cartão de uma ordem de inspeção no quadro, com código, UC, inspetor, resultado e ações da etapa.
 *
 * @param props - Ordem e callback das ações (enviar a campo, registrar resultado, cancelar).
 * @returns Item de lista com o cartão da ordem.
 */
export function OrderCard({ order, onAction }: OrderCardProps) {
  const resultSummary = summarizeFieldResult(order)
  const cancellationText = describeCancellation(order)
  const canWrite = useCanWriteLosses()
  const actions = canWrite ? ACTIONS_BY_STATUS[order.status] : []

  return (
    <li>
      <Card className="flex flex-col gap-1.5 p-3">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-foreground text-sm font-bold tabular-nums">{formatOrderCode(order)}</span>
          <span className="text-muted-foreground text-xs tabular-nums">{formatDate(order.criado_em)}</span>
        </div>
        <p className="text-foreground text-sm tabular-nums">{order.id_uc}</p>
        <p className="text-muted-foreground text-xs">{describeLocation(order)}</p>
        <p className="text-muted-foreground text-xs">{describeInspector(order)}</p>
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
        {actions.length > 0 ? (
          <div className="flex flex-wrap gap-2 pt-1">
            {actions.map((kind) => (
              <Button
                key={kind}
                type="button"
                size="sm"
                variant={kind === 'cancel' ? 'ghost' : 'default'}
                aria-label={`${ACTION_LABELS[kind]} ${formatOrderCode(order)}`}
                onClick={() => onAction(kind, order)}
              >
                {ACTION_LABELS[kind]}
              </Button>
            ))}
          </div>
        ) : null}
      </Card>
    </li>
  )
}
