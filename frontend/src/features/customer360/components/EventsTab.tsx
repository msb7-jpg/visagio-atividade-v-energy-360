import { FeederOutagesList } from '@/features/customer360/components/FeederOutagesList'
import { ServiceTicketsList } from '@/features/customer360/components/ServiceTicketsList'
import { UnitOutagesList } from '@/features/customer360/components/UnitOutagesList'
import type { CustomerEventTimeline } from '@/features/customer360/types/customer360Types'

interface EventsTabProps {
  events: CustomerEventTimeline
}

/**
 * Aba de eventos: falta de luz na própria UC e na região, e chamados abertos pelo cliente.
 *
 * @param props - Eventos retornados por `/events`.
 * @returns Interrupções da UC no topo e, abaixo, região e chamados lado a lado no desktop e empilhados no celular.
 */
export function EventsTab({ events }: EventsTabProps) {
  return (
    <div className="flex flex-col gap-6">
      <section className="flex min-w-0 flex-col gap-3">
        <h3 className="text-foreground text-lg font-bold">Falta de luz nesta unidade</h3>
        <UnitOutagesList outages={events.interrupcoes_uc} summary={events.resumo_interrupcoes_uc} />
      </section>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="flex min-w-0 flex-col gap-3">
          <h3 className="text-foreground text-lg font-bold">Falta de luz na região</h3>
          <FeederOutagesList feeder={events.alimentador} months={events.qualidade_alimentador} />
        </section>
        <section className="flex min-w-0 flex-col gap-3">
          <h3 className="text-foreground text-lg font-bold">Chamados do cliente</h3>
          <ServiceTicketsList tickets={events.chamados} />
        </section>
      </div>
    </div>
  )
}
