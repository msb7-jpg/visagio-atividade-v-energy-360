import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AxiosError, type AxiosResponse } from 'axios'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { lossApi } from '@/features/loss_management/api/lossApi'
import { ExportOrdersButton } from '@/features/loss_management/components/ExportOrdersButton'
import { saveBlobAsFile } from '@/features/loss_management/utils/downloadFile'

vi.mock('@/features/loss_management/api/lossApi', () => ({
  lossApi: { exportInspections: vi.fn() }
}))
vi.mock('@/features/loss_management/utils/downloadFile', () => ({
  saveBlobAsFile: vi.fn()
}))

const mockedApi = vi.mocked(lossApi)
const mockedSave = vi.mocked(saveBlobAsFile)

function renderButton(disabled = false) {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <ExportOrdersButton disabled={disabled} />
    </QueryClientProvider>
  )
}

describe('ExportOrdersButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('baixa o CSV das ordens ativas ao clicar', async () => {
    const csvBlob = new Blob(['id_inspecao;id_uc'], { type: 'text/csv' })
    mockedApi.exportInspections.mockResolvedValue(csvBlob)
    renderButton()

    fireEvent.click(screen.getByRole('button', { name: /Exportar para campo/ }))

    await waitFor(() => expect(mockedSave).toHaveBeenCalledWith(csvBlob, 'ordens_inspecao_campo.csv'))
  })

  it('fica desabilitado quando não há ordens para despachar', () => {
    renderButton(true)

    expect(screen.getByRole('button', { name: /Exportar para campo/ })).toBeDisabled()
  })

  it('trava o botão enquanto o arquivo é gerado', async () => {
    mockedApi.exportInspections.mockReturnValue(new Promise(() => undefined))
    renderButton()

    fireEvent.click(screen.getByRole('button', { name: /Exportar para campo/ }))

    const button = await screen.findByRole('button', { name: /Exportar para campo/ })
    await waitFor(() => expect(button).toBeDisabled())
    expect(button).toHaveAttribute('aria-busy', 'true')
  })

  it('mostra o detalhe do erro da API sem baixar nenhum arquivo', async () => {
    const response = { status: 403, data: { detail: 'Perfil sem permissão.' } } as AxiosResponse
    mockedApi.exportInspections.mockRejectedValue(new AxiosError('Forbidden', '403', undefined, undefined, response))
    renderButton()

    fireEvent.click(screen.getByRole('button', { name: /Exportar para campo/ }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Perfil sem permissão.')
    expect(mockedSave).not.toHaveBeenCalled()
  })
})
