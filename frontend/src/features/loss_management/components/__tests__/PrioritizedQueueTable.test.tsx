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

const headerCheckbox = () => screen.getByRole('checkbox', { name: 'Selecionar as UCs livres da página' })
const lockedUnit = (situacao: QueueSituation) => buildUnit('UC9', { situacao })

describe('PrioritizedQueueTable', () => {
  it('informa quantas UCs aparecem e quantas existem na fila', () => {
    renderTable([buildUnit('UC1'), buildUnit('UC2')], 1248)

    expect(screen.getByText(/Mostrando 1–2 de 2 UCs carregadas \(1\.248 na fila\)/)).toBeInTheDocument()
  })

  it('explica o score ao focar o cabeçalho da coluna pelo teclado', async () => {
    renderTable([buildUnit('UC1')])

    fireEvent.focus(screen.getByRole('button', { name: 'Score' }))

    expect(await screen.findByText(/Score de 0 a 100 = chance de irregularidade/)).toBeInTheDocument()
  })

  it('mostra 25 UCs por página e navega para as seguintes', () => {
    const units = Array.from({ length: 30 }, (_, index) => buildUnit(`UC${index + 1}`))
    renderTable(units)

    expect(screen.getByText('Página 1 de 2')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'UC25' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'UC26' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Página anterior' })).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: 'Próxima página' }))

    expect(screen.getByText('Página 2 de 2')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'UC26' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'UC25' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Próxima página' })).toBeDisabled()
  })

  it('marca pelo cabeçalho só as UCs da página visível', () => {
    const units = Array.from({ length: 30 }, (_, index) => buildUnit(`UC${index + 1}`))
    renderTable(units)

    fireEvent.click(headerCheckbox())
    expect(screen.getByRole('checkbox', { name: 'Selecionar UC25' })).toBeChecked()
    expect(headerCheckbox()).toBeChecked()

    fireEvent.click(screen.getByRole('button', { name: 'Próxima página' }))
    expect(screen.getByRole('checkbox', { name: 'Selecionar UC26' })).not.toBeChecked()
    expect(headerCheckbox()).not.toBeChecked()
  })

  it('desmarca pelo cabeçalho só a página visível, preservando as outras páginas', () => {
    const units = Array.from({ length: 30 }, (_, index) => buildUnit(`UC${index + 1}`))
    renderTable(units)
    fireEvent.click(screen.getByRole('button', { name: 'Próxima página' }))
    fireEvent.click(headerCheckbox())
    fireEvent.click(screen.getByRole('button', { name: 'Página anterior' }))
    fireEvent.click(headerCheckbox())

    fireEvent.click(headerCheckbox())

    expect(screen.getByRole('checkbox', { name: 'Selecionar UC1' })).not.toBeChecked()
    fireEvent.click(screen.getByRole('button', { name: 'Próxima página' }))
    expect(screen.getByRole('checkbox', { name: 'Selecionar UC26' })).toBeChecked()
  })

  it('não mostra a paginação quando tudo cabe em uma página', () => {
    renderTable([buildUnit('UC1')])

    expect(screen.queryByRole('navigation', { name: 'Paginação da fila' })).not.toBeInTheDocument()
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

  it('mostra a queda de consumo da UC com o consumo base e o recente', () => {
    renderTable([buildUnit('UC1', { consumo_base_kwh: 300, consumo_recente_kwh: 200 })])

    const row = screen.getByRole('row', { name: /UC1/ })
    expect(within(row).getByText('−33%')).toBeInTheDocument()
    expect(within(row).getByText('300 → 200 kWh/mês')).toBeInTheDocument()
  })

  it('mostra a chance de acerto de cada UC, que muda com a faixa de queda', () => {
    renderTable([
      buildUnit('UC1', { probabilidade_acerto: 0.93 }),
      buildUnit('UC2', { probabilidade_acerto: 0.07 })
    ])

    expect(within(screen.getByRole('row', { name: /UC1/ })).getByText('93%')).toBeInTheDocument()
    expect(within(screen.getByRole('row', { name: /UC2/ })).getByText('7%')).toBeInTheDocument()
  })

  it('não repete o motivo em cada linha da tabela', () => {
    renderTable([buildUnit('UC1', { motivos: ['queda_moderada'] })])

    expect(screen.queryByText('Queda moderada de consumo')).not.toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: 'Motivos' })).not.toBeInTheDocument()
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
