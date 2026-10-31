import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { QueueCapacityNotice } from '@/features/loss_management/components/QueueCapacityNotice'
import { SelectionOutlookNote } from '@/features/loss_management/components/SelectionOutlookNote'
import { SelectionSummary } from '@/features/loss_management/components/SelectionSummary'
import type { SuspiciousUnit } from '@/features/loss_management/types/lossTypes'

function unitWithChance(idUc: string, probabilidade_acerto: number): SuspiciousUnit {
  return { id_uc: idUc, probabilidade_acerto, situacao: 'na_fila' } as SuspiciousUnit
}

describe('QueueCapacityNotice', () => {
  const units = [unitWithChance('A', 0.42), unitWithChance('B', 0.42), unitWithChance('C', 0.07)]

  it('diz quantas UCs prioritárias há para a capacidade da equipe e a chance das demais', () => {
    render(<QueueCapacityNotice units={units} capacity={200} />)

    expect(screen.getByText(/2 UCs prioritárias para uma capacidade de 200 inspeções por mês/)).toBeInTheDocument()
    expect(screen.getByText(/1 UC de baixa chance acerta no máximo 7%/)).toBeInTheDocument()
  })

  it('não aparece quando as prioritárias enchem a capacidade', () => {
    render(<QueueCapacityNotice units={units} capacity={2} />)

    expect(screen.queryByText(/prioritárias para uma capacidade/)).not.toBeInTheDocument()
  })
})

describe('SelectionSummary', () => {
  it('resume em uma linha quantas UCs foram marcadas e quantas devem achar irregularidade', () => {
    render(<SelectionSummary units={[unitWithChance('A', 0.93), unitWithChance('B', 0.42), unitWithChance('C', 0.42)]} />)

    expect(screen.getByText(/3 selecionadas · cerca de 2 devem achar irregularidade/)).toBeInTheDocument()
    expect(screen.queryByText(/chance abaixo de 30%/)).not.toBeInTheDocument()
  })

  it('mostra o selo de baixa chance só quando a seleção tem UC abaixo do corte', () => {
    render(<SelectionSummary units={[unitWithChance('A', 0.42), unitWithChance('B', 0.07), unitWithChance('C', 0.07)]} />)

    expect(screen.getByText('2 com chance abaixo de 30%')).toBeInTheDocument()
  })

  it('usa o singular com uma UC e não aparece sem seleção', () => {
    const { rerender } = render(<SelectionSummary units={[unitWithChance('A', 0.93)]} />)
    expect(screen.getByText(/1 selecionada · cerca de 1 deve achar irregularidade/)).toBeInTheDocument()

    rerender(<SelectionSummary units={[]} />)
    expect(screen.queryByText(/selecionada/)).not.toBeInTheDocument()
  })
})

describe('SelectionOutlookNote', () => {
  it('mostra quantas inspeções devem achar irregularidade e quantas voltam sem achado', () => {
    render(<SelectionOutlookNote units={[unitWithChance('A', 0.93), unitWithChance('B', 0.42), unitWithChance('C', 0.42)]} />)

    expect(screen.getByText(/cerca de 2 de 3 inspeções devem achar irregularidade/)).toBeInTheDocument()
    expect(screen.getByText(/1 deve voltar sem achado/)).toBeInTheDocument()
    expect(screen.queryByText(/chance de acerto abaixo de 30%/)).not.toBeInTheDocument()
  })

  it('avisa quando a seleção inclui UCs de baixa chance, sem bloquear', () => {
    render(<SelectionOutlookNote units={[unitWithChance('A', 0.42), unitWithChance('B', 0.07), unitWithChance('C', 0.07)]} />)

    expect(screen.getByText(/2 das selecionadas têm chance de acerto abaixo de 30%/)).toBeInTheDocument()
  })

  it('não aparece sem UC selecionada', () => {
    render(<SelectionOutlookNote units={[]} />)

    expect(screen.queryByText(/inspeções devem achar/)).not.toBeInTheDocument()
  })
})
