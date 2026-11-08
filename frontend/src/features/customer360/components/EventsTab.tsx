import { Headset, Home, Network } from 'lucide-react'
import { EventGroup } from '@/features/customer360/components/EventGroup'
import { FeederOutagesList } from '@/features/customer360/components/FeederOutagesList'
import { ServiceTicketsList } from '@/features/customer360/components/ServiceTicketsList'
import { UnitOutagesList } from '@/features/customer360/components/UnitOutagesList'
import type { CustomerEventTimeline } from '@/features/customer360/types/customer360Types'
import { formatCount } from '@/features/customer360/utils/customer360Formatters'

interface EventsTabProps {
  events: CustomerEventTimeline
}

const FEEDER_HINT = 'Valores médios por cliente do alimentador (DEC e FEC), comparados aos outros meses do mesmo circuito.'

/**
 * Conteúdo do bloco "Falta de luz e chamados": três sub-blocos, cada um com ícone, título e contagem.
 *
 * @param props - Eventos retornados por `/events`.
 * @returns Interrupções da UC no topo e, abaixo, região e chamados lado a lado no desktop e empilhados no celular.
 */
export function EventsTab({ events }: EventsTabProps) {
  return (
    <div className="flex flex-col gap-4">
      <EventGroup
        title="Falta de luz nesta unidade"
        scope="Interrupções que atingiram a própria UC."
        icon={<Home className="size-4" />}
        count={formatCount(events.resumo_interrupcoes_uc.total_interrupcoes, 'interrupção', 'interrupções')}
      >
        <UnitOutagesList outages={events.interrupcoes_uc} summary={events.resumo_interrupcoes_uc} />
      </EventGroup>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <EventGroup
          title="Falta de luz na região"
          scope="Média por cliente do alimentador, mês a mês (não é da UC)."
          icon={<Network className="size-4" />}
          count={formatCount(events.qualidade_alimentador.length, 'mês', 'meses')}
          hint={FEEDER_HINT}
        >
          <FeederOutagesList feeder={events.alimentador} months={events.qualidade_alimentador} />
        </EventGroup>
        <EventGroup
          title="Chamados do cliente"
          scope="Atendimentos que a UC abriu no call center."
          icon={<Headset className="size-4" />}
          count={formatCount(events.chamados.length, 'chamado', 'chamados')}
        >
          <ServiceTicketsList tickets={events.chamados} />
        </EventGroup>
      </div>
    </div>
  )
}
