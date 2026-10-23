import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AxiosError, type AxiosResponse } from 'axios'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { lossApi } from '@/features/loss_management/api/lossApi'
import { InspectionUploadModal } from '@/features/loss_management/components/InspectionUploadModal'
import type { UploadResult } from '@/features/loss_management/types/lossTypes'

vi.mock('@/features/loss_management/api/lossApi', () => ({
  lossApi: { uploadFieldResults: vi.fn() }
}))

const mockedApi = vi.mocked(lossApi)

const RESULT: UploadResult = {
  conciliadas: 2,
  ignoradas: 1,
  kwh_recuperado_total: 1250.5,
  rejeitadas: [{ aba: 'Equipe 2', linha: 4, id_inspecao: 9999, motivo: 'Ordem 9999 não encontrada no portal.' }]
}

function makeFile(name = 'retorno.csv') {
  return new File(['id_inspecao;irregularidade_constatada\n1;sim'], name, { type: 'text/csv' })
}

function renderModal(onClose = vi.fn()) {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  render(
    <QueryClientProvider client={queryClient}>
      <InspectionUploadModal onClose={onClose} />
    </QueryClientProvider>
  )
  return onClose
}

function chooseFile(file: File) {
  fireEvent.change(screen.getByLabelText(/Planilha de campo/), { target: { files: [file] } })
}

describe('InspectionUploadModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('mantém o envio desabilitado até escolher um arquivo', () => {
    renderModal()

    expect(screen.getByRole('button', { name: /Enviar planilha/ })).toBeDisabled()
  })

  it('envia o arquivo escolhido e mostra o resumo da conciliação', async () => {
    mockedApi.uploadFieldResults.mockResolvedValue(RESULT)
    renderModal()
    const file = makeFile()

    chooseFile(file)
    fireEvent.click(screen.getByRole('button', { name: /Enviar planilha/ }))

    expect(await screen.findByText(/2 ordens conciliadas/)).toBeInTheDocument()
    expect(mockedApi.uploadFieldResults).toHaveBeenCalledWith(file)
    expect(screen.getByText(/1\.250,5 kWh/)).toBeInTheDocument()
    expect(screen.getByText(/1 linha sem resultado/)).toBeInTheDocument()
    expect(screen.getByText(/Ordem 9999 não encontrada no portal\./)).toBeInTheDocument()
    expect(screen.getByText(/Equipe 2/)).toBeInTheDocument()
  })

  it('aceita o arquivo solto na área de arrastar e soltar', async () => {
    mockedApi.uploadFieldResults.mockResolvedValue(RESULT)
    renderModal()
    const file = makeFile('campo.xlsx')

    fireEvent.drop(screen.getByTestId('upload-drop-zone'), { dataTransfer: { files: [file] } })

    expect(await screen.findByText('campo.xlsx')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Enviar planilha/ })).toBeEnabled()
  })

  it('recusa formatos que não sejam .csv ou .xlsx sem chamar a API', () => {
    renderModal()

    chooseFile(makeFile('retorno.pdf'))

    expect(screen.getByRole('alert')).toHaveTextContent(/\.csv ou \.xlsx/)
    expect(screen.getByRole('button', { name: /Enviar planilha/ })).toBeDisabled()
    expect(mockedApi.uploadFieldResults).not.toHaveBeenCalled()
  })

  it('trava o envio enquanto a planilha é processada', async () => {
    mockedApi.uploadFieldResults.mockReturnValue(new Promise(() => undefined))
    renderModal()
    chooseFile(makeFile())

    fireEvent.click(screen.getByRole('button', { name: /Enviar planilha/ }))

    const button = await screen.findByRole('button', { name: /Enviar planilha/ })
    await waitFor(() => expect(button).toBeDisabled())
    expect(button).toHaveAttribute('aria-busy', 'true')
  })

  it('mostra o detalhe do erro da API', async () => {
    const response = { status: 400, data: { detail: "Coluna 'id_inspecao' não encontrada." } } as AxiosResponse
    mockedApi.uploadFieldResults.mockRejectedValue(new AxiosError('Bad', '400', undefined, undefined, response))
    renderModal()
    chooseFile(makeFile())

    fireEvent.click(screen.getByRole('button', { name: /Enviar planilha/ }))

    expect(await screen.findByRole('alert')).toHaveTextContent("Coluna 'id_inspecao' não encontrada.")
  })

  it('fecha o diálogo pelo botão Voltar', () => {
    const onClose = renderModal()

    fireEvent.click(screen.getByRole('button', { name: 'Voltar' }))

    expect(onClose).toHaveBeenCalled()
  })
})
