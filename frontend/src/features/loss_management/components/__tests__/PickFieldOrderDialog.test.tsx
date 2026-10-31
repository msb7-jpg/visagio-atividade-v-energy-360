import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { PickFieldOrderDialog } from '@/features/loss_management/components/PickFieldOrderDialog'
import type { InspectionOrder } from '@/features/loss_management/types/lossTypes'

function buildFieldOrder(idInspecao: number, idUc: string): InspectionOrder {
  return {
    id_inspecao: idInspecao,
    id_uc: idUc,
    status: 'pendente',
    criado_em: '2026-10-01T10:00:00'
  } as InspectionOrder
}

describe('PickFieldOrderDialog', () => {
  it('libera "Continuar" só depois de escolher a ordem e devolve a ordem escolhida', () => {
    const onPick = vi.fn()
    const fieldOrders = [buildFieldOrder(7, 'UC100002'), buildFieldOrder(9, 'UC100005')]
    render(<PickFieldOrderDialog fieldOrders={fieldOrders} onPick={onPick} onClose={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Continuar' })).toBeDisabled()

    fireEvent.change(screen.getByLabelText(/Ordem em campo/), { target: { value: '9' } })
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))

    expect(onPick).toHaveBeenCalledWith(fieldOrders[1])
  })

  it('explica o que falta quando não há ordem em campo', () => {
    render(<PickFieldOrderDialog fieldOrders={[]} onPick={vi.fn()} onClose={vi.fn()} />)

    expect(screen.getByText(/Não há ordem em campo/)).toBeInTheDocument()
    expect(screen.queryByLabelText(/Ordem em campo/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeDisabled()
  })
})
