import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { FieldResultsKpis } from '@/features/loss_management/components/FieldResultsKpis'
import type { InspectionOrder } from '@/features/loss_management/types/lossTypes'

let nextOrderId = 1

function buildOrder(status: InspectionOrder['status'], irregular: boolean | null = null): InspectionOrder {
  nextOrderId += 1
  return {
    id_inspecao: nextOrderId,
    id_uc: 'UC1',
    status,
    motivo: null,
    kwh_estimado: 0,
    fiscal_responsavel: null,
    irregularidade_constatada: irregular,
    tipo_irregularidade: null,
    kwh_recuperado: irregular ? 1000 : null,
    numero_toi: null,
    justificativa_cancelamento: null,
    criado_por: 'x',
    criado_em: '2026-01-01T00:00:00',
    atualizado_em: '2026-01-01T00:00:00'
  }
}

const completedOrders = (count: number) =>
  Array.from({ length: count }, (_, position) => buildOrder('concluida', position % 2 === 0))

describe('FieldResultsKpis', () => {
  it('avisa que a amostra é pequena e marca o n na taxa de acerto real', () => {
    render(<FieldResultsKpis orders={completedOrders(6)} />)

    expect(screen.getByRole('note')).toHaveTextContent('Só 6 ordens concluídas')
    expect(screen.getByText('n = 6: amostra pequena')).toBeInTheDocument()
  })

  it('só conta as ordens concluídas para decidir se a amostra é pequena', () => {
    const orders = [...completedOrders(2), buildOrder('gerada'), buildOrder('pendente'), buildOrder('cancelada')]

    render(<FieldResultsKpis orders={orders} />)

    expect(screen.getByRole('note')).toHaveTextContent('Só 2 ordens concluídas')
  })

  it('não avisa com 30 ordens concluídas ou mais', () => {
    render(<FieldResultsKpis orders={completedOrders(30)} />)

    expect(screen.queryByRole('note')).not.toBeInTheDocument()
    expect(screen.queryByText(/amostra pequena/)).not.toBeInTheDocument()
  })

  it('sem nenhuma ordem concluída só diz que não há ordem, sem aviso de amostra', () => {
    render(<FieldResultsKpis orders={[buildOrder('gerada')]} />)

    expect(screen.getByText('Nenhuma ordem concluída ainda')).toBeInTheDocument()
    expect(screen.queryByRole('note')).not.toBeInTheDocument()
  })

  it('continua mostrando os números mesmo com o aviso, para não esconder o que existe', () => {
    render(<FieldResultsKpis orders={completedOrders(6)} />)

    expect(screen.getByText('Ordens concluídas')).toBeInTheDocument()
    expect(screen.getByText('Com achado')).toBeInTheDocument()
    expect(screen.getByText('Taxa de acerto real')).toBeInTheDocument()
  })
})
