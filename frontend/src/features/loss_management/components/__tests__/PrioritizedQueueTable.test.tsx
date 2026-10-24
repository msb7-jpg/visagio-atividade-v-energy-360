import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { PrioritizedQueueTable } from '@/features/loss_management/components/PrioritizedQueueTable'
import { ScoreBar } from '@/features/loss_management/components/ScoreBar'
import { useQueueSelection } from '@/features/loss_management/hooks/useQueueSelection'
import type { QueueSituation, SuspiciousUnit } from '@/features/loss_management/types/lossTypes'

function buildUnit(idUc: string, overrides: Partial<SuspiciousUnit> = {}): SuspiciousUnit {
  return {
    id_uc: idUc,
    municipio: 'Recife',
    bairro: 'Pina',
    classe_consumo: 'Comercial',
    motivos: ['queda_subita', 'leitura_zerada'],
    score_risco: 60,
    score: 80,
    situacao: 'na_fila',
    probabilidade_acerto: 0.93,
    consumo_base_kwh: 300,
    consumo_recente_kwh: 50,
    kwh_estimado_recuperar: 750,
    valor_estimado_recuperar_rs: 535.5,
    kwh_mes_recuperavel: 1120,
    valor_ano_rs: 9600,
    ...overrides
  }
}

function Harness({ units, total = units.length }: { units: SuspiciousUnit[]; total?: number }) {
  const selection = useQueueSelection(units)
  return <PrioritizedQueueTable units={units} total={total} selection={selection} />
}

function renderTable(units: SuspiciousUnit[], total?: number) {
  return render(
    <MemoryRouter>
      <Harness units={units} total={total} />
    </MemoryRouter>
  )
}

const headerCheckbox = () => screen.getByRole('checkbox', { name: 'Selecionar todas as UCs livres' })
const lockedUnit = (situacao: QueueSituation) => buildUnit('UC9', { situacao })

describe('PrioritizedQueueTable', () => {
  it('informa quantas UCs aparecem e quantas existem na fila', () => {
    renderTable([buildUnit('UC1'), buildUnit('UC2')], 1248)

    expect(screen.getByText(/Mostrando 2 de 1\.248 UCs \(top 2 por score\)/)).toBeInTheDocument()
  })

  it('marca todas as UCs livres pelo cabeçalho e limpa no segundo clique', () => {
    renderTable([buildUnit('UC1'), buildUnit('UC2'), lockedUnit('em_campo')])

    fireEvent.click(headerCheckbox())
    expect(screen.getByRole('checkbox', { name: 'Selecionar UC1' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Selecionar UC2' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Selecionar UC9' })).not.toBeChecked()
    expect(headerCheckbox()).toBeChecked()

    fireEvent.click(headerCheckbox())
    expect(screen.getByRole('checkbox', { name: 'Selecionar UC1' })).not.toBeChecked()
  })

  it('mostra o cabeçalho como parcial quando só parte das UCs livres está marcada', () => {
    renderTable([buildUnit('UC1'), buildUnit('UC2')])

    fireEvent.click(screen.getByRole('checkbox', { name: 'Selecionar UC1' }))

    expect(headerCheckbox()).toHaveAttribute('aria-checked', 'mixed')
  })

  it('desliga o cabeçalho quando nenhuma UC pode ser marcada', () => {
    renderTable([lockedUnit('ordem_gerada')])

    expect(headerCheckbox()).toBeDisabled()
  })

  it('mostra traço quando a UC não tem bairro, município ou classe', () => {
    renderTable([buildUnit('UC1', { bairro: null, municipio: null, classe_consumo: null })])

    expect(within(screen.getByRole('row', { name: /UC1/ })).getAllByText('—')).toHaveLength(3)
  })

  it('mostra um chip por motivo da UC', () => {
    renderTable([buildUnit('UC1')])

    const row = screen.getByRole('row', { name: /UC1/ })
    expect(within(row).getByText('Queda abrupta de consumo')).toBeInTheDocument()
    expect(within(row).getByText('Consumo zero com medidor ativo')).toBeInTheDocument()
  })

  it('codifica o id da UC no link para a Visão 360', () => {
    renderTable([buildUnit('UC 1/2')])

    expect(screen.getByRole('link', { name: 'UC 1/2' })).toHaveAttribute('href', '/customers?uc=UC%201%2F2')
  })

  it('mostra o valor anual de forma compacta e o kWh por mês com separador de milhar', () => {
    renderTable([buildUnit('UC1', { kwh_mes_recuperavel: 6200, valor_ano_rs: 53100 })])

    const row = screen.getByRole('row', { name: /UC1/ })
    expect(within(row).getByText('6.200')).toBeInTheDocument()
    expect(within(row).getByText('R$ 53,1 mil')).toBeInTheDocument()
  })
})

describe('ScoreBar', () => {
  it.each([
    [94, 'bg-destructive'],
    [70, 'bg-warning'],
    [30, 'bg-muted-foreground']
  ])('usa a cor da faixa de prioridade para o score %i', (score, expectedClass) => {
    const { container } = render(<ScoreBar score={score} />)

    expect(container.querySelector(`.${expectedClass}`)).not.toBeNull()
    expect(screen.getByRole('meter', { name: `Score ${score} de 100` })).toHaveAttribute('aria-valuenow', String(score))
  })
})
