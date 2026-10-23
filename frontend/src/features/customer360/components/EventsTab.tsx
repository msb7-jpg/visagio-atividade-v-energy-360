import { FeederOutagesList } from '@/features/customer360/components/FeederOutagesList'
import { ServiceTicketsList } from '@/features/customer360/components/ServiceTicketsList'
import type { CustomerEventTimeline } from '@/features/customer360/types/customer360Types'

interface EventsTabProps {
  events: CustomerEventTimeline
}

/**
 * Aba de eventos: falta de luz na região da UC e chamados abertos pelo cliente.
 *
 * @param props - Eventos retornados por `/events`.
 * @returns Duas seções lado a lado no desktop e empilhadas no celular.
 */
export function EventsTab({ events }: EventsTabProps) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <section className="flex min-w-0 flex-col gap-3">
        <h3 className="text-foreground text-base font-bold">Falta de luz na região</h3>
        <FeederOutagesList feeder={events.alimentador} months={events.qualidade_alimentador} />
      </section>
      <section className="flex min-w-0 flex-col gap-3">
        <h3 className="text-foreground text-base font-bold">Chamados do cliente</h3>
        <ServiceTicketsList tickets={events.chamados} />
      </section>
    </div>
  )
}
