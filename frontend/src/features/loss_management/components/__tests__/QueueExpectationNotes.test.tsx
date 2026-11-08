import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SelectionOutlookNote } from '@/features/loss_management/components/SelectionOutlookNote'
import type { SuspiciousUnit } from '@/features/loss_management/types/lossTypes'

function unitWithChance(idUc: string, probabilidade_acerto: number): SuspiciousUnit {
  return { id_uc: idUc, probabilidade_acerto, situacao: 'na_fila' } as SuspiciousUnit
}

describe('SelectionOutlookNote', () => {
  it('mostra quantas das selecionadas são prioritárias, sem aviso quando todas são', () => {
    render(<SelectionOutlookNote units={[unitWithChance('A', 0.93), unitWithChance('B', 0.42), unitWithChance('C', 0.42)]} />)

    expect(screen.getByText(/3 de 3 selecionadas são prioritárias/)).toBeInTheDocument()
    expect(screen.queryByText(/fora da faixa prioritária/)).not.toBeInTheDocument()
  })

  it('avisa quando a seleção inclui UCs fora da faixa prioritária, sem bloquear', () => {
    render(<SelectionOutlookNote units={[unitWithChance('A', 0.42), unitWithChance('B', 0.07), unitWithChance('C', 0.07)]} />)

    expect(screen.getByText(/1 de 3 selecionadas são prioritárias/)).toBeInTheDocument()
    expect(screen.getByText(/2 das selecionadas estão fora da faixa prioritária/)).toBeInTheDocument()
  })

  it('não mostra chance de acerto nem inspeções esperadas', () => {
    render(<SelectionOutlookNote units={[unitWithChance('A', 0.93)]} />)

    expect(screen.queryByText(/chance/)).not.toBeInTheDocument()
    expect(screen.queryByText(/devem achar/)).not.toBeInTheDocument()
  })

  it('não aparece sem UC selecionada', () => {
    render(<SelectionOutlookNote units={[]} />)

    expect(screen.queryByText(/prioritárias/)).not.toBeInTheDocument()
  })
})
