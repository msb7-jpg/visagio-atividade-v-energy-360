import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { lossApi } from '@/features/loss_management/api/lossApi'
import { useCreateInspectionsBatchMutation } from '@/features/loss_management/hooks/useLossMutations'
import { lossKeys } from '@/features/loss_management/queries/lossQueries'
import type { InspectionOrder } from '@/features/loss_management/types/lossTypes'

vi.mock('@/features/loss_management/api/lossApi', () => ({
  lossApi: { createInspection: vi.fn() }
}))

const mockedCreate = vi.mocked(lossApi.createInspection)

function makeOrder(idUc: string): InspectionOrder {
  return {
    id_inspecao: 1,
    id_uc: idUc,
    status: 'gerada',
    motivo: null,
    kwh_estimado: 750,
    fiscal_responsavel: null,
    irregularidade_constatada: null,
    tipo_irregularidade: null,
    kwh_recuperado: null,
    numero_toi: null,
    justificativa_cancelamento: null,
    criado_por: 'perdas@venergy.com',
    criado_em: '2026-10-24T10:00:00',
    atualizado_em: '2026-10-24T10:00:00'
  }
}

const toPayloads = (unitIds: string[]) => unitIds.map((idUc) => ({ id_uc: idUc }))

function renderBatchMutation() {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  const rendered = renderHook(() => useCreateInspectionsBatchMutation(), { wrapper })
  return { ...rendered, invalidateSpy }
}

describe('useCreateInspectionsBatchMutation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('gera uma ordem por UC selecionada e devolve todas como criadas', async () => {
    mockedCreate.mockImplementation(async ({ id_uc: idUc }) => makeOrder(idUc))
    const { result } = renderBatchMutation()

    const batchResult = await act(() => result.current.mutateAsync(toPayloads(['UC1', 'UC2'])))

    expect(mockedCreate).toHaveBeenCalledTimes(2)
    expect(batchResult.created.map((order) => order.id_uc)).toEqual(['UC1', 'UC2'])
    expect(batchResult.failed).toEqual([])
  })

  it('não aborta o lote quando uma UC falha e informa qual falhou', async () => {
    mockedCreate.mockImplementation(async ({ id_uc: idUc }) => {
      if (idUc === 'UC2') throw new Error('UC já tem ordem ativa.')
      return makeOrder(idUc)
    })
    const { result } = renderBatchMutation()

    const batchResult = await act(() => result.current.mutateAsync(toPayloads(['UC1', 'UC2', 'UC3'])))

    expect(batchResult.created.map((order) => order.id_uc)).toEqual(['UC1', 'UC3'])
    expect(batchResult.failed).toEqual([{ id_uc: 'UC2', message: expect.any(String) }])
  })

  it('limita a poucas requisições simultâneas para não sobrecarregar o banco', async () => {
    let inFlight = 0
    let peakInFlight = 0
    mockedCreate.mockImplementation(async ({ id_uc: idUc }) => {
      inFlight += 1
      peakInFlight = Math.max(peakInFlight, inFlight)
      await Promise.resolve()
      inFlight -= 1
      return makeOrder(idUc)
    })
    const { result } = renderBatchMutation()
    const unitIds = Array.from({ length: 12 }, (_, unitIndex) => `UC${unitIndex}`)

    const batchResult = await act(() => result.current.mutateAsync(toPayloads(unitIds)))

    expect(batchResult.created).toHaveLength(12)
    expect(peakInFlight).toBeLessThanOrEqual(5)
  })

  it('invalida fila, resumo e ordens depois do lote, mesmo com falhas parciais', async () => {
    mockedCreate.mockRejectedValue(new Error('falha'))
    const { result, invalidateSpy } = renderBatchMutation()

    await act(() => result.current.mutateAsync(toPayloads(['UC1'])))

    await waitFor(() => expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: lossKeys.all }))
  })
})
