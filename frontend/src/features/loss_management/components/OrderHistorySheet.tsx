import { AsyncState } from '@/components/feedback/AsyncState'
import { Card } from '@/components/ui/card'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useOrderEventsQuery } from '@/features/loss_management/hooks/useLossQueries'
import type { InspectionOrder } from '@/features/loss_management/types/lossTypes'
import type { OrderEvent } from '@/features/loss_management/types/orderEventTypes'
import { describeChange, EVENT_LABELS, formatEventDate } from '@/features/loss_management/utils/orderEventFormat'
import { formatOrderCode } from '@/features/loss_management/utils/orderBoard'

interface OrderHistorySheetProps {
  order: InspectionOrder
  onClose: () => void
}

function EventItem({ event }: { event: OrderEvent }) {
  const changes = Object.entries(event.alteracoes)
  return (
    <li>
      <Card className="flex flex-col gap-1 p-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="text-sm font-medium">{EVENT_LABELS[event.tipo] ?? event.tipo}</span>
          <time className="text-muted-foreground text-xs" dateTime={event.criado_em}>
            {formatEventDate(event.criado_em)}
          </time>
        </div>
        <span className="text-muted-foreground text-xs">Por {event.autor}</span>
        {changes.length > 0 ? (
          <ul className="text-sm">
            {changes.map(([field, values]) => (
              <li key={field}>{describeChange(field, values)}</li>
            ))}
          </ul>
        ) : null}
      </Card>
    </li>
  )
}

/**
 * Gaveta com o histórico (trilha de auditoria) da ordem: quem mudou o quê, quando, e os valores antes e depois.
 *
 * @param props - Ordem aberta e fechamento da gaveta.
 * @returns Linha do tempo real da ordem; ordens anteriores à trilha mostram o aviso de que não há registro.
 */
export function OrderHistorySheet({ order, onClose }: OrderHistorySheetProps) {
  const query = useOrderEventsQuery(order.id_inspecao)
  const events = query.data ?? []

  return (
    <Sheet open onOpenChange={(isOpen) => (isOpen ? undefined : onClose())}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Histórico da ordem {formatOrderCode(order)}</SheetTitle>
          <SheetDescription>UC {order.id_uc}. Registro de cada mudança feita na ordem.</SheetDescription>
        </SheetHeader>
        <AsyncState
          isLoading={query.isLoading}
          isError={query.isError}
          isEmpty={events.length === 0}
          errorTitle="Não foi possível carregar o histórico"
          onRetry={() => void query.refetch()}
          emptyTitle="Nenhum registro para esta ordem"
          emptyDescription="O histórico guarda só as mudanças feitas depois da criação da trilha de auditoria."
        >
          <ol className="flex flex-col gap-4 overflow-y-auto px-4 pb-4">
            {events.map((event) => (
              <EventItem key={event.id_evento} event={event} />
            ))}
          </ol>
        </AsyncState>
      </SheetContent>
    </Sheet>
  )
}
