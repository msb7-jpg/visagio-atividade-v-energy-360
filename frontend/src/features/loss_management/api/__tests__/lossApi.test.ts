import { AxiosError, type AxiosResponse } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/lib/api-client'
import { lossApi } from '@/features/loss_management/api/lossApi'
import { getApiErrorMessage } from '@/features/loss_management/utils/apiErrorMessage'

vi.mock('@/lib/api-client', () => ({
  apiClient: { get: vi.fn() }
}))

const mockedGet = vi.mocked(apiClient.get)

function blobError(status: number, body: string): AxiosError {
  const response = { status, data: new Blob([body], { type: 'application/json' }) } as AxiosResponse
  return new AxiosError('Request failed', String(status), undefined, undefined, response)
}

describe('lossApi.exportInspections', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('devolve o arquivo quando a API responde com sucesso', async () => {
    const csvBlob = new Blob(['id_inspecao'], { type: 'text/csv' })
    mockedGet.mockResolvedValue({ data: csvBlob })

    await expect(lossApi.exportInspections()).resolves.toBe(csvBlob)
  })

  it('expõe o detail do erro mesmo com a resposta lida como blob', async () => {
    mockedGet.mockRejectedValue(blobError(403, JSON.stringify({ detail: 'Perfil sem permissão.' })))

    const failure = await lossApi.exportInspections().catch((error: unknown) => error)

    expect(getApiErrorMessage(failure)).toBe('Perfil sem permissão.')
  })

  it('mantém o erro original quando o corpo do erro não é JSON', async () => {
    mockedGet.mockRejectedValue(blobError(500, 'Internal Server Error'))

    const failure = await lossApi.exportInspections().catch((error: unknown) => error)

    expect(failure).toBeInstanceOf(AxiosError)
    expect(getApiErrorMessage(failure)).toBe('Não foi possível concluir a operação. Tente novamente.')
  })
})
