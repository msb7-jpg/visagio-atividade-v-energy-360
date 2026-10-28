import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { QueueBandTabs } from '@/features/loss_management/components/QueueBandTabs'
import { useQueueSelection } from '@/features/loss_management/hooks/useQueueSelection'
import type { SuspiciousUnit } from '@/features/loss_management/types/lossTypes'

function buildUnit(idUc: string, hitProbability: number): SuspiciousUnit {
  return {
    id_uc: idUc,
    municipio: 'Recife',
    bairro: 'Pina',
    classe_consumo: 'Residencial',
    motivos: ['queda_moderada'],
    score_risco: 30,
    score: 50,
    situacao: 'na_fila',
    probabilidade_acerto: hitProbability,
    consumo_base_kwh: 300,
    consumo_recente_kwh: 200,
    kwh_estimado_recuperar: 300,
    valor_estimado_recuperar_rs: 214,
    kwh_mes_recuperavel: 100,
    valor_ano_rs: 857
  }
}

function Harness({ units, total = units.length }: { units: SuspiciousUnit[]; total?: number }) {
  const selection = useQueueSelection(units)
  return <QueueBandTabs units={units} total={total} selection={selection} onOpenDetail={vi.fn()} />
}

function renderTabs(units: SuspiciousUnit[], total?: number) {
  return render(
    <MemoryRouter>
      <Harness units={units} total={total} />
    </MemoryRouter>
  )
}

const tab = (name: RegExp) => screen.getByRole('tab', { name })

describe('QueueBandTabs', () => {
  it('abre nas prioritárias e mostra a contagem de cada aba', () => {
    renderTabs([buildUnit('UC1', 0.42), buildUnit('UC2', 0.07), buildUnit('UC3', 0.07)])

    expect(tab(/Prioritárias · 1/)).toHaveAttribute('aria-selected', 'true')
    expect(tab(/Baixa chance · 2/)).toHaveAttribute('aria-selected', 'false')
    expect(tab(/Todas · 3/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'UC1' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'UC2' })).not.toBeInTheDocument()
    expect(screen.getByText('Chance de acerto de 30% ou mais')).toBeInTheDocument()
  })

  it('usa o sublinhado nas abas da faixa, para não parecer o segundo nível das abas da página', () => {
    renderTabs([buildUnit('UC1', 0.42)])

    expect(screen.getByRole('tablist', { name: 'Faixa da fila por chance de acerto' })).toHaveAttribute(
      'data-variant',
      'line'
    )
  })

  it('troca de faixa pela aba e mostra só as UCs dela', () => {
    renderTabs([buildUnit('UC1', 0.42), buildUnit('UC2', 0.07)])

    fireEvent.click(tab(/Baixa chance/))

    expect(screen.getByRole('link', { name: 'UC2' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'UC1' })).not.toBeInTheDocument()
    expect(screen.getByText('Chance de acerto abaixo de 30%')).toBeInTheDocument()
  })

  it('mostra todas as UCs na aba Todas', () => {
    renderTabs([buildUnit('UC1', 0.42), buildUnit('UC2', 0.07)])

    fireEvent.click(tab(/Todas/))

    expect(screen.getByRole('link', { name: 'UC1' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'UC2' })).toBeInTheDocument()
  })

  it('abre na baixa chance e desliga as prioritárias quando não há nenhuma', () => {
    renderTabs([buildUnit('UC1', 0.07)])

    expect(tab(/Prioritárias · 0/)).toHaveAttribute('aria-disabled', 'true')
    expect(tab(/Baixa chance · 1/)).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('link', { name: 'UC1' })).toBeInTheDocument()
  })

  it('desliga a aba de baixa chance quando todas as UCs são prioritárias', () => {
    renderTabs([buildUnit('UC1', 0.93), buildUnit('UC2', 0.42)])

    expect(tab(/Baixa chance · 0/)).toHaveAttribute('aria-disabled', 'true')
  })

  it('mantém as UCs marcadas ao trocar de aba', () => {
    renderTabs([buildUnit('UC1', 0.42), buildUnit('UC2', 0.07)])
    fireEvent.click(screen.getByRole('checkbox', { name: 'Selecionar UC1' }))

    fireEvent.click(tab(/Baixa chance/))
    fireEvent.click(tab(/Prioritárias/))

    expect(screen.getByRole('checkbox', { name: 'Selecionar UC1' })).toBeChecked()
  })

  it('avisa quando a fila foi cortada antes de chegar à tela', () => {
    renderTabs([buildUnit('UC1', 0.42)], 1248)

    expect(screen.getByText('Carregadas as 1 primeiras UCs de 1.248 na fila.')).toBeInTheDocument()
  })

  it('não avisa corte quando todas as UCs da fila foram carregadas', () => {
    renderTabs([buildUnit('UC1', 0.42)])

    expect(screen.queryByText(/Carregadas as/)).not.toBeInTheDocument()
  })
})
