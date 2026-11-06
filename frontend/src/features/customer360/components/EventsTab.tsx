import { FeederOutagesList } from '@/features/customer360/components/FeederOutagesList'
import { ServiceTicketsList } from '@/features/customer360/components/ServiceTicketsList'
import { UnitOutagesList } from '@/features/customer360/components/UnitOutagesList'
import type { CustomerEventTimeline } from '@/features/customer360/types/customer360Types'

interface EventsTabProps {
  events: CustomerEventTimeline
}

/**
 * Conteúdo do bloco "Problemas técnicos": falta de luz na própria UC e na região, e chamados abertos pelo cliente.
 *
 * @param props - Eventos retornados por `/events`.
 * @returns Interrupções da UC no topo e, abaixo, região e chamados lado a lado no desktop e empilhados no celular.
 */
export function EventsTab({ events }: EventsTabProps) {
  return (
    <div className="flex flex-col gap-6">
      <section className="flex min-w-0 flex-col gap-3">
        <h3 className="text-foreground text-sm font-semibold">Falta de luz nesta unidade</h3>
        <UnitOutagesList outages={events.interrupcoes_uc} summary={events.resumo_interrupcoes_uc} />
      </section>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="flex min-w-0 flex-col gap-3">
          <h3 className="text-foreground text-sm font-semibold">Falta de luz na região</h3>
          <div className="max-h-96 overflow-auto">
            <FeederOutagesList feeder={events.alimentador} months={events.qualidade_alimentador} />
          </div>
        </section>
        <section className="flex min-w-0 flex-col gap-3">
          <h3 className="text-foreground text-sm font-semibold">Chamados do cliente</h3>
          <div className="max-h-96 overflow-auto">
            <ServiceTicketsList tickets={events.chamados} />
          </div>
        </section>
      </div>
    </div>
  )
}
