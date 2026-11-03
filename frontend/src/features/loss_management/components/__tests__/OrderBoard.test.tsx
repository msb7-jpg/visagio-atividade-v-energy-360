import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { lossApi } from '@/features/loss_management/api/lossApi'
import { CancelOrderDialog } from '@/features/loss_management/components/CancelOrderDialog'
import { OrderBoard } from '@/features/loss_management/components/OrderBoard'
import { RegisterResultDialog } from '@/features/loss_management/components/RegisterResultDialog'
import type { InspectionOrder } from '@/features/loss_management/types/lossTypes'

vi.mock('@/features/loss_management/api/lossApi', () => ({
  lossApi: { updateInspection: vi.fn(), listInspectors: vi.fn() }
}))
vi.mock('@/features/auth/hooks/useAuth')

function signInAs(role: string) {
  vi.mocked(useAuth).mockReturnValue({ user: { role } } as ReturnType<typeof useAuth>)
}

beforeEach(() => signInAs('gerente_perdas'))

function buildOrder(overrides: Partial<InspectionOrder>): InspectionOrder {
  return {
    id_inspecao: 1,
    id_uc: 'UC131844',
    status: 'gerada',
    motivo: null,
    kwh_estimado: 0,
    fiscal_responsavel: null,
    irregularidade_constatada: null,
    tipo_irregularidade: null,
    kwh_recuperado: null,
    numero_toi: null,
    justificativa_cancelamento: null,
    criado_por: 'teste@exemplo.com',
    criado_em: '2026-06-26T10:00:00',
    atualizado_em: '2026-06-26T10:00:00',
    ...overrides
  }
}

function renderBoard(orders: InspectionOrder[], overrides: Partial<Parameters<typeof OrderBoard>[0]> = {}) {
  const props = { orders, isLoading: false, isError: false, onRetry: vi.fn(), onAction: vi.fn(), ...overrides }
  render(<OrderBoard {...props} />)
  return props
}

describe('OrderBoard', () => {
  it('mostra a UC com o bairro, com os acentos restaurados', () => {
    renderBoard([buildOrder({ bairro: 'BOA VIAGEM', municipio: 'JABOATAO DOS GUARARAPES' })])

    expect(screen.getByText('UC131844', { exact: false }).closest('p')).toHaveTextContent('UC131844 · Boa Viagem')
  })

  it('mostra só a UC quando a ordem vem sem bairro', () => {
    renderBoard([buildOrder({ bairro: null, municipio: 'RECIFE' })])

    expect(screen.getByText('UC131844').closest('p')).toHaveTextContent(/^UC131844$/)
  })

  it('mostra as quatro etapas com contagem e aviso nas vazias', () => {
    renderBoard([buildOrder({ id_inspecao: 1 }), buildOrder({ id_inspecao: 2 })])

    expect(screen.getByRole('region', { name: 'Gerada (2)' })).toBeInTheDocument()
    const emptyColumn = screen.getByRole('region', { name: 'Pendente (em campo) (0)' })
    expect(within(emptyColumn).getByText('Nenhuma ordem nesta etapa.')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Concluída (0)' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Cancelada (0)' })).toBeInTheDocument()
  })

  it('oferece despachar e cancelar na ordem gerada, e registrar resultado e cancelar na que está em campo', () => {
    renderBoard([buildOrder({ id_inspecao: 1 }), buildOrder({ id_inspecao: 2, status: 'pendente' })])

    const generatedColumn = screen.getByRole('region', { name: 'Gerada (1)' })
    expect(within(generatedColumn).getByRole('button', { name: /^Despachar/ })).toBeInTheDocument()
    expect(within(generatedColumn).getByRole('button', { name: /^Cancelar OI-/ })).toBeInTheDocument()
    const fieldColumn = screen.getByRole('region', { name: 'Pendente (em campo) (1)' })
    expect(within(fieldColumn).getByRole('button', { name: /^Registrar resultado/ })).toBeInTheDocument()
    expect(within(fieldColumn).getByRole('button', { name: /^Cancelar OI-/ })).toBeInTheDocument()
    expect(within(fieldColumn).queryByRole('button', { name: /^Despachar/ })).not.toBeInTheDocument()
  })

  it('dispara o cancelamento com a ordem do cartão ao clicar em "Cancelar"', () => {
    const order = buildOrder({ id_inspecao: 5 })
    const { onAction } = renderBoard([order])

    fireEvent.click(screen.getByRole('button', { name: /^Cancelar OI-/ }))

    expect(onAction).toHaveBeenCalledWith('cancel', order)
  })

  it('não oferece ações em ordens concluídas e canceladas, e mostra resultado e motivo', () => {
    renderBoard([
      buildOrder({ id_inspecao: 3, status: 'concluida', irregularidade_constatada: true, tipo_irregularidade: 'BY-PASS', kwh_recuperado: 860 }),
      buildOrder({ id_inspecao: 4, status: 'cancelada', justificativa_cancelamento: 'UC regularizada pelo cliente' })
    ])

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.getByText('Irregularidade confirmada · BY-PASS · 860 kWh')).toBeInTheDocument()
    expect(screen.getByText('Cancelada: UC regularizada pelo cliente')).toBeInTheDocument()
  })

  it('mostra a coluna de canceladas aberta, sem botão para recolher', () => {
    renderBoard([buildOrder({ id_inspecao: 4, status: 'cancelada', justificativa_cancelamento: 'UC regularizada pelo cliente' })])

    expect(screen.getByText('Cancelada: UC regularizada pelo cliente')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /recolher|expandir/ })).not.toBeInTheDocument()
  })

  it('mostra a data de criação, a energia a recuperar e "sem inspetor" na ordem gerada', () => {
    renderBoard([buildOrder({ kwh_estimado: 189 })])

    expect(screen.getByText('26/06/2026')).toBeInTheDocument()
    expect(screen.getByText('189 kWh a recuperar · sem inspetor')).toBeInTheDocument()
  })

  it('mostra "sem inspetor" na ordem cancelada sem inspetor, mas não na concluída', () => {
    renderBoard([
      buildOrder({ id_inspecao: 1, status: 'cancelada' }),
      buildOrder({ id_inspecao: 2, status: 'concluida', irregularidade_constatada: false })
    ])

    expect(screen.getAllByText('sem inspetor')).toHaveLength(1)
  })

  it('mostra o inspetor quando já há um e não mostra energia a recuperar sem estimativa', () => {
    renderBoard([buildOrder({ status: 'pendente', inspetor: 'INSP-014', kwh_estimado: 0 })])

    expect(screen.getByText('INSP-014')).toBeInTheDocument()
    expect(screen.queryByText(/a recuperar/)).not.toBeInTheDocument()
  })

  it('mostra inspetor e data da inspeção nas ordens concluídas', () => {
    renderBoard([buildOrder({ status: 'concluida', irregularidade_constatada: false, inspetor: 'INSP-014', data_inspecao: '2026-10-27' })])

    expect(screen.getByText('INSP-014')).toBeInTheDocument()
    expect(screen.getByText('Inspeção em 27/10/2026')).toBeInTheDocument()
  })

  it('mostra o motivo, a observação e o que houve com a UC na fila nas ordens canceladas', () => {
    renderBoard([
      buildOrder({ id_inspecao: 1, status: 'cancelada', motivo_cancelamento: 'ordem_duplicada' }),
      buildOrder({ id_inspecao: 2, status: 'cancelada', motivo_cancelamento: 'outro', justificativa_cancelamento: 'Cliente mudou' }),
      buildOrder({ id_inspecao: 3, status: 'cancelada', motivo_cancelamento: 'cliente_regularizou', atualizado_em: '2026-06-22T10:00:00' })
    ])

    expect(screen.getByText('Cancelada: Ordem duplicada · UC voltou à fila na hora')).toBeInTheDocument()
    expect(screen.getByText('Cancelada: Outro · Cliente mudou · UC voltou à fila na hora')).toBeInTheDocument()
    expect(
      screen.getByText('Cancelada: UC regularizada pelo cliente · UC fora da fila por 90 dias (até 20/09/2026)')
    ).toBeInTheDocument()
  })

  it('dispara a ação com a ordem do cartão', () => {
    const order = buildOrder({ id_inspecao: 7 })
    const { onAction } = renderBoard([order])

    fireEvent.click(screen.getByRole('button', { name: /^Despachar/ }))

    expect(onAction).toHaveBeenCalledWith('dispatch', order)
  })

  it('esconde as ações dos cartões para quem só consulta, mas mantém o resumo do resultado', () => {
    signInAs('diretor')
    renderBoard([
      buildOrder({ id_inspecao: 1, status: 'gerada' }),
      buildOrder({ id_inspecao: 2, id_uc: 'UC200', status: 'pendente' }),
      buildOrder({ id_inspecao: 3, id_uc: 'UC300', status: 'concluida', irregularidade_constatada: false })
    ])

    expect(screen.queryAllByRole('button')).toHaveLength(0)
    expect(screen.getByText('UC300')).toBeInTheDocument()
  })

  it('mostra um esqueleto com uma coluna por etapa enquanto carrega', () => {
    renderBoard([], { isLoading: true })

    const skeleton = screen.getByLabelText('Carregando ordens de inspeção')
    expect(skeleton).toHaveAttribute('aria-busy', 'true')
    expect(skeleton.children).toHaveLength(4)
    expect(screen.queryByRole('region', { name: 'Ordens de inspeção' })).not.toBeInTheDocument()
  })

  it('oferece "Tentar novamente" quando a consulta falha', () => {
    const { onRetry } = renderBoard([], { isError: true })

    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(onRetry).toHaveBeenCalledOnce()
  })
})

describe('RegisterResultDialog', () => {
  function renderDialog() {
    vi.mocked(lossApi.listInspectors).mockResolvedValue([{ codigo: 'INSP-014' }])
    const queryClient = new QueryClient()
    render(
      <QueryClientProvider client={queryClient}>
        <RegisterResultDialog order={buildOrder({ status: 'pendente' })} onClose={vi.fn()} />
      </QueryClientProvider>
    )
  }

  it('mostra erro abaixo do campo quando há irregularidade sem tipo e sem kWh', async () => {
    renderDialog()

    fireEvent.change(await screen.findByLabelText(/Irregularidade constatada\?/), { target: { value: 'sim' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar resultado' }))

    expect(await screen.findByText('Informe o tipo de irregularidade.')).toBeInTheDocument()
    const kwhField = screen.getByLabelText(/kWh recuperado/)
    expect(kwhField).toHaveAttribute('aria-describedby', 'kwh-erro')
    expect(kwhField).toHaveAttribute('aria-invalid', 'true')
    expect(kwhField).toHaveClass('border-destructive')
    expect(screen.getByLabelText(/Tipo de irregularidade/)).toHaveClass('border-destructive')
    expect(document.getElementById('kwh-erro')).toHaveTextContent('Informe o kWh recuperado (número maior que zero).')
  })

  it('mostra os tipos de irregularidade com acento e sem caixa alta', async () => {
    renderDialog()

    const typeField = await screen.findByLabelText(/Tipo de irregularidade/)

    expect(within(typeField).getByRole('option', { name: 'Ligação clandestina' })).toHaveValue('LIGACAO CLANDESTINA')
    expect(within(typeField).getByRole('option', { name: 'By-pass' })).toHaveValue('BY-PASS')
  })

  it('aceita o kWh digitado como texto decimal e envia o número ao salvar', async () => {
    vi.mocked(lossApi.updateInspection).mockResolvedValue(buildOrder({ status: 'concluida' }))
    renderDialog()

    await screen.findByRole('option', { name: 'INSP-014' })
    fireEvent.change(screen.getByLabelText(/^Inspetor/), { target: { value: 'INSP-014' } })
    fireEvent.change(screen.getByLabelText(/Data da inspeção/), { target: { value: '2026-10-27' } })
    fireEvent.change(screen.getByLabelText(/Irregularidade constatada\?/), { target: { value: 'sim' } })
    fireEvent.change(screen.getByLabelText(/Tipo de irregularidade/), { target: { value: 'BY-PASS' } })
    const kwhField = screen.getByLabelText(/kWh recuperado/)
    expect(kwhField).toHaveAttribute('type', 'text')
    expect(kwhField).toHaveAttribute('inputmode', 'decimal')
    fireEvent.change(kwhField, { target: { value: '1.240' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar resultado' }))

    await waitFor(() => expect(lossApi.updateInspection).toHaveBeenCalledOnce())
    expect(lossApi.updateInspection).toHaveBeenCalledWith(1, expect.objectContaining({ kwh_recuperado: 1240 }))
    expect(document.getElementById('kwh-erro')).toBeNull()
  })
})

describe('CancelOrderDialog', () => {
  const renderCancelDialog = () =>
    render(<QueryClientProvider client={new QueryClient()}><CancelOrderDialog order={buildOrder({})} onClose={vi.fn()} /></QueryClientProvider>)

  it('só diz o que acontece com a UC depois de escolher o motivo', () => {
    renderCancelDialog()

    expect(screen.queryByText(/volta para a fila/)).toBeNull()
    expect(screen.queryByText(/fica fora da fila/)).toBeNull()
  })

  it.each(['repriorizacao_equipe', 'ordem_duplicada', 'outro'])('avisa que a UC volta para a fila quando o motivo é %s', (reason) => {
    renderCancelDialog()

    fireEvent.change(screen.getByLabelText(/Motivo do cancelamento/), { target: { value: reason } })

    expect(screen.getByText(/A UC UC131844 volta para a fila e o score é recalculado no próximo processamento\./)).toBeInTheDocument()
  })

  it.each(['cliente_regularizou', 'endereco_nao_localizado'])('avisa que a UC fica fora da fila por 90 dias quando o motivo é %s', (reason) => {
    renderCancelDialog()

    fireEvent.change(screen.getByLabelText(/Motivo do cancelamento/), { target: { value: reason } })

    expect(screen.getByText(/A UC UC131844 fica fora da fila por 90 dias\./)).toBeInTheDocument()
    expect(screen.queryByText(/volta para a fila/)).toBeNull()
  })
})
