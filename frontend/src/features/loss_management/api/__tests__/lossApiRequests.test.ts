import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/lib/api-client'
import { lossApi } from '@/features/loss_management/api/lossApi'

vi.mock('@/lib/api-client', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn() }
}))

const mockedGet = vi.mocked(apiClient.get)
const mockedPost = vi.mocked(apiClient.post)
const mockedPatch = vi.mocked(apiClient.patch)

describe('lossApi: fila e ordens', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('envia os filtros da fila como query params e repassa o signal', async () => {
    mockedGet.mockResolvedValue({ data: { itens: [], total: 0, avisos: [] } })
    const abortController = new AbortController()

    await lossApi.listSuspiciousUnits({ motivo: 'queda_subita', municipio: 'Recife' }, abortController.signal)

    expect(mockedGet).toHaveBeenCalledWith('/losses/suspicious-units', {
      params: { motivo: 'queda_subita', municipio: 'Recife' },
      signal: abortController.signal
    })
  })

  it('lista todas as ordens sem filtro de status', async () => {
    mockedGet.mockResolvedValue({ data: [] })

    await lossApi.listInspections(undefined)

    expect(mockedGet).toHaveBeenCalledWith('/losses/inspections', { params: undefined, signal: undefined })
  })

  it('filtra as ordens por status quando ele é informado', async () => {
    mockedGet.mockResolvedValue({ data: [] })

    await lossApi.listInspections('pendente')

    expect(mockedGet).toHaveBeenCalledWith('/losses/inspections', { params: { status: 'pendente' }, signal: undefined })
  })

  it('cria a ordem enviando a UC e o motivo', async () => {
    mockedPost.mockResolvedValue({ data: { id_inspecao: 1 } })

    const order = await lossApi.createInspection({ id_uc: 'UC1', motivo: 'Queda abrupta de consumo' })

    expect(mockedPost).toHaveBeenCalledWith('/losses/inspections', { id_uc: 'UC1', motivo: 'Queda abrupta de consumo' })
    expect(order).toEqual({ id_inspecao: 1 })
  })

  it('atualiza a ordem pelo identificador', async () => {
    mockedPatch.mockResolvedValue({ data: { id_inspecao: 7 } })

    await lossApi.updateInspection(7, { status: 'pendente', fiscal_responsavel: 'Equipe 3' })

    expect(mockedPatch).toHaveBeenCalledWith('/losses/inspections/7', { status: 'pendente', fiscal_responsavel: 'Equipe 3' })
  })

  it('envia a planilha de campo como multipart com o campo file', async () => {
    mockedPost.mockResolvedValue({ data: { conciliadas: 1, ignoradas: 0, rejeitadas: [], kwh_recuperado_total: 10 } })
    const spreadsheet = new File(['id_inspecao'], 'campo.csv', { type: 'text/csv' })

    await lossApi.uploadFieldResults(spreadsheet)

    const [url, body, config] = mockedPost.mock.calls[0]
    expect(url).toBe('/losses/inspections/upload')
    expect((body as FormData).get('file')).toBe(spreadsheet)
    expect(config?.headers).toEqual({ 'Content-Type': 'multipart/form-data' })
  })
})
