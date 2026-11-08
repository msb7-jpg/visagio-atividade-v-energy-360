import { Badge } from '@/components/ui/badge'
import { ShowMoreButton } from '@/features/customer360/components/ShowMoreButton'
import { useExpandableList } from '@/features/customer360/hooks/useExpandableList'
import type { ServiceTicket } from '@/features/customer360/types/customer360Types'
import { formatDate, formatNumber, formatSentenceCase } from '@/features/customer360/utils/customer360Formatters'

const VISIBLE_TICKETS = 5

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
  const { visible, hiddenCount, expanded, toggle } = useExpandableList(tickets, VISIBLE_TICKETS)
  if (tickets.length === 0) {
    return <p className="text-muted-foreground text-sm">Esta unidade ainda não abriu chamados no call center.</p>
  }
  return (
    <div className="flex flex-col gap-3">
      <ul aria-label="Chamados abertos" className="flex flex-col gap-2">
        {visible.map((ticket) => (
          <li key={ticket.id_atendimento} className="border-border flex flex-wrap items-center justify-between gap-3 rounded-md border px-3 py-2.5">
            <div className="flex flex-col">
              <span className="text-foreground text-sm font-medium">{ticket.motivo_chamado ? formatSentenceCase(ticket.motivo_chamado) : 'Motivo não informado'}</span>
              <span className="text-muted-foreground text-xs">
                <span className="font-mono">{ticket.numero_protocolo ?? ticket.id_atendimento}</span> · aberto em {formatDate(ticket.data_abertura)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {ticket.nota_csat === null ? null : <span className="text-muted-foreground text-xs">Nota {formatNumber(ticket.nota_csat)}</span>}
              <Badge variant={ticket.status_chamado === 'ABERTO' ? 'warning' : 'muted'}>{ticket.status_chamado ? formatSentenceCase(ticket.status_chamado) : 'Sem status'}</Badge>
            </div>
          </li>
        ))}
      </ul>
      <ShowMoreButton hiddenCount={hiddenCount} expanded={expanded} onToggle={toggle} />
    </div>
  )
}
