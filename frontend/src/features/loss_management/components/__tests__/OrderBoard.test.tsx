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
  lossApi: { updateInspection: vi.fn() }
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
  it('mostra as quatro etapas com contagem e aviso nas vazias', () => {
    renderBoard([buildOrder({ id_inspecao: 1 }), buildOrder({ id_inspecao: 2 })])

    expect(screen.getByRole('region', { name: 'Pendente (2)' })).toBeInTheDocument()
    const emptyColumn = screen.getByRole('region', { name: 'Em campo (0)' })
    expect(within(emptyColumn).getByText('Nenhuma ordem nesta etapa.')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Concluída (0)' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Cancelada (0)' })).toBeInTheDocument()
  })

  it('oferece enviar a campo e cancelar em ordem pendente, e só registrar resultado e cancelar em campo', () => {
    renderBoard([buildOrder({ id_inspecao: 1 }), buildOrder({ id_inspecao: 2, status: 'pendente' })])

    const pendingColumn = screen.getByRole('region', { name: 'Pendente (1)' })
    expect(within(pendingColumn).getByRole('button', { name: /^Enviar a campo/ })).toBeInTheDocument()
    expect(within(pendingColumn).getByRole('button', { name: /^Cancelar/ })).toBeInTheDocument()
    const fieldColumn = screen.getByRole('region', { name: 'Em campo (1)' })
    expect(within(fieldColumn).getByRole('button', { name: /^Registrar resultado/ })).toBeInTheDocument()
    expect(within(fieldColumn).queryByRole('button', { name: /^Enviar a campo/ })).not.toBeInTheDocument()
  })

  it('não oferece ações em ordens concluídas e canceladas, e mostra resultado e motivo', () => {
    renderBoard([
      buildOrder({ id_inspecao: 3, status: 'concluida', irregularidade_constatada: true, tipo_irregularidade: 'BY-PASS', kwh_recuperado: 860 }),
      buildOrder({ id_inspecao: 4, status: 'cancelada', justificativa_cancelamento: 'UC regularizada pelo cliente' })
    ])

    expect(screen.queryAllByRole('button')).toHaveLength(0)
    expect(screen.getByText('Irregularidade confirmada · BY-PASS · 860 kWh')).toBeInTheDocument()
    expect(screen.getByText('Cancelada: UC regularizada pelo cliente')).toBeInTheDocument()
  })

  it('dispara a ação com a ordem do cartão', () => {
    const order = buildOrder({ id_inspecao: 7 })
    const { onAction } = renderBoard([order])

    fireEvent.click(screen.getByRole('button', { name: /^Enviar a campo/ }))

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

    fireEvent.change(await screen.findByLabelText(/Irregularidade constatada\?/), { target: { value: 'sim' } })
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
  it('avisa que a UC volta para a fila e que o score é recalculado', () => {
    render(<QueryClientProvider client={new QueryClient()}><CancelOrderDialog order={buildOrder({})} onClose={vi.fn()} /></QueryClientProvider>)

    expect(screen.getByText(/A UC UC131844 volta para a fila e o score é recalculado no próximo processamento\./)).toBeInTheDocument()
  })
})
