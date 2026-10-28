import { Headset } from 'lucide-react'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Badge } from '@/components/ui/badge'
import type { ServiceTicket } from '@/features/customer360/types/customer360Types'
import { formatDate } from '@/features/customer360/utils/customer360Formatters'

interface ServiceTicketsListProps {
  tickets: ServiceTicket[]
}

/**
 * Chamados que a UC já abriu no call center, do mais recente para o mais antigo.
 *
 * @param props - Chamados retornados por `/events`.
 * @returns Lista de chamados com protocolo, motivo, data, situação e nota de satisfação.
 */
export function ServiceTicketsList({ tickets }: ServiceTicketsListProps) {
  if (tickets.length === 0) {
    return (
      <EmptyState
        title="Nenhum chamado aberto"
        description="Esta unidade consumidora ainda não abriu chamados no call center."
        icon={<Headset className="size-10" />}
      />
    )
  }
  return (
    <ul aria-label="Chamados abertos" className="flex flex-col gap-2">
      {tickets.map((ticket) => (
        <li key={ticket.id_atendimento} className="border-border flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
          <div className="flex flex-col">
            <span className="text-foreground text-sm font-semibold">{ticket.motivo_chamado ?? 'Motivo não informado'}</span>
            <span className="text-muted-foreground text-xs">
              <span className="font-mono">{ticket.numero_protocolo ?? ticket.id_atendimento}</span> · aberto em {formatDate(ticket.data_abertura)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {ticket.nota_csat === null ? null : <Badge variant="outline">Nota {ticket.nota_csat}</Badge>}
            <Badge variant="secondary">{ticket.status_chamado ?? 'Sem status'}</Badge>
          </div>
        </li>
      ))}
    </ul>
  )
}
