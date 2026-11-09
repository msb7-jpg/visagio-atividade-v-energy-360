import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { EventsTab } from '@/features/customer360/components/EventsTab'
import type { CustomerEventTimeline, ServiceTicket, UnitOutage } from '@/features/customer360/types/customer360Types'

function outage(index: number): UnitOutage {
  return {
    id_ocorrencia: `OC${index}`,
    competencia: '2026-03',
    inicio_interrupcao: `2026-03-${String(index).padStart(2, '0')} 07:05:00`,
    fim_interrupcao: `2026-03-${String(index).padStart(2, '0')} 08:05:00`,
    duracao_horas: 1,
    tipo_ocorrencia: 'FIO PARTIDO',
    causa: 'VEGETACAO'
  }
}

function ticket(index: number): ServiceTicket {
  return {
    id_atendimento: `AT${index}`,
    numero_protocolo: `PRT-${index}`,
    motivo_chamado: 'FATURA',
    data_abertura: '2026-06-25 09:15:00',
    status_chamado: 'ABERTO',
    nota_csat: index === 1 ? 3.8 : null
  }
}

function buildEvents(outageCount: number, ticketCount: number): CustomerEventTimeline {
  const outages = Array.from({ length: outageCount }, (_, index) => outage(index + 1))
  return {
    id_uc: 'UC1',
    alimentador: 'ALM-1',
    qualidade_alimentador: [],
    interrupcoes_uc: outages,
    resumo_interrupcoes_uc: { total_interrupcoes: outageCount, total_horas: outageCount, mais_longa: outages[0] ?? null },
    inspecoes: [],
    chamados: Array.from({ length: ticketCount }, (_, index) => ticket(index + 1))
  }
}

describe('EventsTab', () => {
  it('separa as três listas em sub-blocos com título e contagem', () => {
    render(<EventsTab events={buildEvents(2, 3)} />)

    expect(screen.getByRole('heading', { name: 'Falta de luz nesta unidade' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Falta de luz na região' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Chamados do cliente' })).toBeInTheDocument()
    expect(screen.getByText('2 interrupções')).toBeInTheDocument()
    expect(screen.getByText('0 meses')).toBeInTheDocument()
    expect(screen.getByText('3 chamados')).toBeInTheDocument()
    expect(screen.getByText(/Média por cliente do alimentador/)).toBeInTheDocument()
    expect(screen.getByText('Nota 3,8')).toBeInTheDocument()
  })

  it('deixa a ajuda da região focável pelo teclado e rotula as colunas por cliente', () => {
    render(<EventsTab events={{ ...buildEvents(1, 1), qualidade_alimentador: [{ competencia: '2026-05', dec_apurado_horas: 4.2, fec_apurado_vezes: 3, dec_limite_aneel: 2.5, fec_limite_aneel: 2, violou_meta: true }] }} />)

    const help = screen.getByRole('button', { name: /Valores médios por cliente do alimentador/ })
    help.focus()
    expect(help).toHaveFocus()
    const table = screen.getByRole('table', { name: 'Interrupções no alimentador' })
    expect(within(table).getByText('Horas por cliente')).toBeInTheDocument()
    expect(within(table).getByText('Interrupções por cliente')).toBeInTheDocument()
  })

  it('usa um estado vazio curto quando não há registros', () => {
    render(<EventsTab events={buildEvents(0, 0)} />)

    expect(screen.getByText('Nenhuma interrupção registrada nesta unidade.')).toBeInTheDocument()
    expect(screen.getByText('Esta unidade ainda não abriu chamados no call center.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Ver todos/ })).not.toBeInTheDocument()
  })

  it('mostra as mais recentes e expande o restante no próprio bloco', () => {
    render(<EventsTab events={buildEvents(8, 7)} />)

    const outages = screen.getByRole('table', { name: 'Interrupções na unidade consumidora' })
    expect(within(outages).getAllByRole('row')).toHaveLength(1 + 5)
    const tickets = screen.getByRole('list', { name: 'Chamados abertos' })
    expect(within(tickets).getAllByRole('listitem')).toHaveLength(5)

    fireEvent.click(screen.getByRole('button', { name: 'Ver todos (mais 3)' }))
    expect(within(outages).getAllByRole('row')).toHaveLength(1 + 8)
    fireEvent.click(screen.getByRole('button', { name: 'Ver todos (mais 2)' }))
    expect(within(tickets).getAllByRole('listitem')).toHaveLength(7)
    fireEvent.click(screen.getAllByRole('button', { name: 'Mostrar menos' })[0])
    expect(within(outages).getAllByRole('row')).toHaveLength(1 + 5)
  })
})
