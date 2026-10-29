import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { AxiosError, type AxiosResponse } from 'axios'
import { toast } from 'sonner'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { lossApi } from '@/features/loss_management/api/lossApi'
import { CancelOrderDialog } from '@/features/loss_management/components/CancelOrderDialog'
import { InspectorField, SEARCHABLE_INSPECTORS_THRESHOLD } from '@/features/loss_management/components/InspectorField'
import { RegisterResultDialog } from '@/features/loss_management/components/RegisterResultDialog'
import type { InspectionOrder } from '@/features/loss_management/types/lossTypes'
import { todayIsoDate } from '@/features/loss_management/utils/resultFormValidation'

vi.mock('sonner', () => ({ toast: { success: vi.fn() } }))
vi.mock('@/features/loss_management/api/lossApi', () => ({
  lossApi: { updateInspection: vi.fn(), listInspectors: vi.fn() }
}))

const mockedApi = vi.mocked(lossApi)

function buildOrder(overrides: Partial<InspectionOrder> = {}): InspectionOrder {
  return {
    id_inspecao: 1,
    id_uc: 'UC131844',
    status: 'pendente',
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

function buildApiError(status: number, detail: unknown): AxiosError {
  const response = { status, statusText: '', headers: {}, config: {}, data: { detail } } as AxiosResponse
  return new AxiosError('falhou', String(status), undefined, undefined, response)
}

function inspectorsUpTo(count: number) {
  return Array.from({ length: count }, (_, index) => ({ codigo: `INSP-${String(index + 1).padStart(3, '0')}` }))
}

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
  return queryClient
}

beforeEach(() => {
  vi.clearAllMocks()
  mockedApi.listInspectors.mockResolvedValue(inspectorsUpTo(5))
})

async function fillValidVisit(inspectorCode = 'INSP-003') {
  await screen.findByRole('option', { name: inspectorCode })
  fireEvent.change(screen.getByLabelText(/^Inspetor/), { target: { value: inspectorCode } })
  fireEvent.change(screen.getByLabelText(/Data da inspeção/), { target: { value: '2026-10-27' } })
  fireEvent.change(screen.getByLabelText(/Irregularidade constatada\?/), { target: { value: 'nao' } })
}

describe('RegisterResultDialog', () => {
  it('marca inspetor, data e resultado como obrigatórios', async () => {
    renderWithClient(<RegisterResultDialog order={buildOrder()} onClose={vi.fn()} />)

    expect(await screen.findByText(/^Inspetor/, { selector: 'label' })).toHaveTextContent('*')
    expect(screen.getByText(/Data da inspeção/, { selector: 'label' })).toHaveTextContent('*')
    expect(screen.getByText(/Irregularidade constatada\?/, { selector: 'label' })).toHaveTextContent('*')
  })

  it('leva o foco inicial ao campo de inspetor e o mantém quando a lista de 40 chega', async () => {
    mockedApi.listInspectors.mockResolvedValue(inspectorsUpTo(40))
    renderWithClient(<RegisterResultDialog order={buildOrder()} onClose={vi.fn()} />)

    await waitFor(() => expect(screen.getByLabelText(/^Inspetor/)).toHaveFocus())
    await screen.findByRole('option', { name: 'INSP-040' })

    expect(screen.getByLabelText(/^Inspetor/)).toHaveFocus()
  })

  it('limita a data a hoje e mostra no campo as datas futuras recusadas', async () => {
    const onClose = vi.fn()
    renderWithClient(<RegisterResultDialog order={buildOrder()} onClose={onClose} />)
    await fillValidVisit()
    const dateField = screen.getByLabelText(/Data da inspeção/)
    expect(dateField).toHaveAttribute('max', todayIsoDate())

    fireEvent.change(dateField, { target: { value: '2999-01-01' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar resultado' }))

    expect(await screen.findByText('A data da inspeção não pode ser futura.')).toBeInTheDocument()
    expect(dateField).toHaveAttribute('aria-invalid', 'true')
    expect(dateField).toHaveAttribute('aria-describedby', 'data-erro')
    expect(mockedApi.updateInspection).not.toHaveBeenCalled()
  })

  it('não envia com inspetor, data e resultado em branco e anuncia cada erro ao lado do campo', async () => {
    renderWithClient(<RegisterResultDialog order={buildOrder()} onClose={vi.fn()} />)
    await screen.findByRole('option', { name: 'INSP-003' })

    fireEvent.click(screen.getByRole('button', { name: 'Salvar resultado' }))

    expect(await screen.findByText('Selecione o inspetor.')).toHaveAttribute('role', 'alert')
    expect(screen.getByText('Informe a data da inspeção.')).toHaveAttribute('role', 'alert')
    expect(screen.getByText('Informe se houve irregularidade.')).toHaveAttribute('role', 'alert')
    expect(screen.getByLabelText(/^Inspetor/)).toHaveAttribute('aria-describedby', 'inspetor-resultado-erro')
    expect(mockedApi.updateInspection).not.toHaveBeenCalled()
  })

  it('envia inspetor e data no payload e fecha com um toast ao salvar', async () => {
    const onClose = vi.fn()
    mockedApi.updateInspection.mockResolvedValue(buildOrder({ status: 'concluida' }))
    renderWithClient(<RegisterResultDialog order={buildOrder()} onClose={onClose} />)
    await fillValidVisit('INSP-004')

    fireEvent.click(screen.getByRole('button', { name: 'Salvar resultado' }))

    await waitFor(() => expect(onClose).toHaveBeenCalledOnce())
    expect(mockedApi.updateInspection).toHaveBeenCalledWith(1, {
      status: 'concluida', inspetor: 'INSP-004', data_inspecao: '2026-10-27', irregularidade_constatada: false
    })
    expect(toast.success).toHaveBeenCalledWith('Resultado de OI-2026-0001 registrado.')
  })

  it('invalida fila e ordens depois de salvar, para o quadro atualizar sem recarregar', async () => {
    mockedApi.updateInspection.mockResolvedValue(buildOrder({ status: 'concluida' }))
    const queryClient = renderWithClient(<RegisterResultDialog order={buildOrder()} onClose={vi.fn()} />)
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
    await fillValidVisit()

    fireEvent.click(screen.getByRole('button', { name: 'Salvar resultado' }))

    await waitFor(() => expect(invalidate).toHaveBeenCalledWith({ queryKey: ['losses'] }))
  })

  it('mostra o 422 do servidor em pt-BR ao lado do campo e não fecha o diálogo', async () => {
    const onClose = vi.fn()
    mockedApi.updateInspection.mockRejectedValue(buildApiError(422, [
      { loc: ['body', 'data_inspecao'], msg: 'Value error, A data da inspeção não pode ser futura.', type: 'value_error' }
    ]))
    renderWithClient(<RegisterResultDialog order={buildOrder()} onClose={onClose} />)
    await fillValidVisit()

    fireEvent.click(screen.getByRole('button', { name: 'Salvar resultado' }))

    const fieldError = await screen.findByText('A data da inspeção não pode ser futura.')
    expect(fieldError).toHaveAttribute('id', 'data-erro')
    expect(screen.getByLabelText(/Data da inspeção/)).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('mostra no rodapé o erro que não é de campo, sem fechar o diálogo', async () => {
    const onClose = vi.fn()
    mockedApi.updateInspection.mockRejectedValue(buildApiError(409, 'Transição de status inválida.'))
    renderWithClient(<RegisterResultDialog order={buildOrder()} onClose={onClose} />)
    await fillValidVisit()

    fireEvent.click(screen.getByRole('button', { name: 'Salvar resultado' }))

    expect(await screen.findByText('Transição de status inválida.')).toHaveAttribute('role', 'alert')
    expect(onClose).not.toHaveBeenCalled()
  })

  it('cancela com Esc', async () => {
    const onClose = vi.fn()
    renderWithClient(<RegisterResultDialog order={buildOrder()} onClose={onClose} />)
    await screen.findByRole('option', { name: 'INSP-003' })

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })

    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })
})

describe('CancelOrderDialog', () => {
  it('lista os motivos do contrato tipado e só habilita a confirmação depois de escolher um', async () => {
    renderWithClient(<CancelOrderDialog order={buildOrder()} onClose={vi.fn()} />)
    const reasonField = await screen.findByLabelText(/^Motivo do cancelamento/)
    const confirmButton = screen.getByRole('button', { name: 'Confirmar cancelamento' })

    const optionLabels = within(reasonField).getAllByRole('option').map((option) => option.textContent)
    expect(optionLabels).toEqual([
      'Selecione o motivo',
      'UC regularizada pelo cliente',
      'Ordem duplicada',
      'Endereço não localizado ou acesso negado',
      'Repriorização da equipe',
      'Outro'
    ])
    expect(confirmButton).toBeDisabled()
    expect(screen.getByText(/^Motivo do cancelamento/, { selector: 'label' })).toHaveTextContent('*')

    fireEvent.change(reasonField, { target: { value: 'ordem_duplicada' } })
    expect(confirmButton).toBeEnabled()
  })

  it('envia o motivo e a observação opcional', async () => {
    const onClose = vi.fn()
    mockedApi.updateInspection.mockResolvedValue(buildOrder({ status: 'cancelada' }))
    renderWithClient(<CancelOrderDialog order={buildOrder()} onClose={onClose} />)

    fireEvent.change(await screen.findByLabelText(/^Motivo do cancelamento/), { target: { value: 'outro' } })
    fireEvent.change(screen.getByLabelText(/^Observação/), { target: { value: '  Cliente mudou  ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar cancelamento' }))

    await waitFor(() => expect(onClose).toHaveBeenCalledOnce())
    expect(mockedApi.updateInspection).toHaveBeenCalledWith(1, {
      status: 'cancelada', motivo_cancelamento: 'outro', justificativa_cancelamento: 'Cliente mudou'
    })
    expect(toast.success).toHaveBeenCalledWith('OI-2026-0001 cancelada.')
  })

  it('mostra o 422 ao lado do campo de motivo, em pt-BR, e não fecha o diálogo', async () => {
    const onClose = vi.fn()
    mockedApi.updateInspection.mockRejectedValue(buildApiError(422, [
      { loc: ['body', 'motivo_cancelamento'], msg: 'Input should be ...', type: 'enum' }
    ]))
    renderWithClient(<CancelOrderDialog order={buildOrder()} onClose={onClose} />)

    fireEvent.change(await screen.findByLabelText(/^Motivo do cancelamento/), { target: { value: 'outro' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar cancelamento' }))

    const fieldError = await screen.findByText('Escolha uma das opções da lista.')
    expect(fieldError).toHaveAttribute('id', 'motivo-cancelamento-erro')
    expect(screen.getByLabelText(/^Motivo do cancelamento/)).toHaveAttribute('aria-describedby', 'motivo-cancelamento-erro')
    expect(onClose).not.toHaveBeenCalled()
  })

  it('mostra no rodapé o erro que não é de campo, sem fechar o diálogo', async () => {
    const onClose = vi.fn()
    mockedApi.updateInspection.mockRejectedValue(buildApiError(409, 'Transição de status inválida.'))
    renderWithClient(<CancelOrderDialog order={buildOrder()} onClose={onClose} />)

    fireEvent.change(await screen.findByLabelText(/^Motivo do cancelamento/), { target: { value: 'outro' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar cancelamento' }))

    expect(await screen.findByText('Transição de status inválida.')).toHaveAttribute('role', 'alert')
    expect(onClose).not.toHaveBeenCalled()
  })

  it('limpa o erro do servidor quando o usuário muda o motivo', async () => {
    mockedApi.updateInspection.mockRejectedValue(buildApiError(409, 'Transição de status inválida.'))
    renderWithClient(<CancelOrderDialog order={buildOrder()} onClose={vi.fn()} />)
    fireEvent.change(await screen.findByLabelText(/^Motivo do cancelamento/), { target: { value: 'outro' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar cancelamento' }))
    await screen.findByText('Transição de status inválida.')

    fireEvent.change(screen.getByLabelText(/^Motivo do cancelamento/), { target: { value: 'ordem_duplicada' } })

    await waitFor(() => expect(screen.queryByText('Transição de status inválida.')).not.toBeInTheDocument())
  })

  it('leva o foco ao campo de motivo e cancela com Esc', async () => {
    const onClose = vi.fn()
    renderWithClient(<CancelOrderDialog order={buildOrder()} onClose={onClose} />)

    await waitFor(() => expect(screen.getByLabelText(/^Motivo do cancelamento/)).toHaveFocus())
    fireEvent.keyDown(screen.getByRole('alertdialog'), { key: 'Escape' })

    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })
})

describe('InspectorField', () => {
  it('usa a lista simples até 15 inspetores', async () => {
    mockedApi.listInspectors.mockResolvedValue(inspectorsUpTo(SEARCHABLE_INSPECTORS_THRESHOLD))
    renderWithClient(<InspectorField id="inspetor-teste" value="" onChange={vi.fn()} />)

    await screen.findByRole('option', { name: 'INSP-015' })

    expect(screen.getByLabelText('Inspetor').tagName).toBe('SELECT')
  })

  it('passa a buscar por digitação com mais de 15 inspetores e devolve o código escolhido', async () => {
    const onChange = vi.fn()
    mockedApi.listInspectors.mockResolvedValue(inspectorsUpTo(40))
    renderWithClient(<InspectorField id="inspetor-teste" value="" onChange={onChange} />)

    const searchField = await screen.findByLabelText('Inspetor')
    await screen.findByRole('option', { name: 'INSP-040' })
    expect(searchField.tagName).toBe('INPUT')
    fireEvent.change(searchField, { target: { value: 'INSP-014' } })
    fireEvent.click(await screen.findByRole('option', { name: 'INSP-014' }))

    expect(screen.queryByRole('option', { name: 'INSP-015' })).not.toBeInTheDocument()
    expect(onChange).toHaveBeenLastCalledWith('INSP-014')
  })

  it('mostra aviso em pt-BR e permite tentar de novo quando a lista não carrega', async () => {
    mockedApi.listInspectors.mockRejectedValueOnce(buildApiError(500, 'Erro interno'))
    mockedApi.listInspectors.mockResolvedValue(inspectorsUpTo(3))
    renderWithClient(<InspectorField id="inspetor-teste" value="" onChange={vi.fn()} />)

    expect(await screen.findByText('Não foi possível carregar os inspetores.')).toHaveAttribute('role', 'alert')
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(await screen.findByRole('option', { name: 'INSP-003' })).toBeInTheDocument()
  })
})
