import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { QueryKey } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { lossApi } from '@/features/loss_management/api/lossApi'
import { useUpdateInspectionMutation } from '@/features/loss_management/hooks/useLossMutations'
import { lossKeys } from '@/features/loss_management/queries/lossQueries'
import type { InspectionOrder } from '@/features/loss_management/types/lossTypes'

vi.mock('@/features/loss_management/api/lossApi', () => ({
  lossApi: { updateInspection: vi.fn() }
}))

const mockedUpdate = vi.mocked(lossApi.updateInspection)

const ORDER: InspectionOrder = {
  id_inspecao: 1,
  id_uc: 'UC1',
  status: 'pendente',
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

const CHANGED_BY_AN_ORDER: Array<[string, QueryKey]> = [
  ['a fila', lossKeys.suspiciousUnits({})],
  ['o resumo dos cartões', lossKeys.queueSummary([])],
  ['as opções de filtro', lossKeys.queueFilters()],
  ['a aba Fora da fila', lossKeys.excludedUnits({})],
  ['as ordens', lossKeys.inspections()],
  ['o detalhe de uma UC', lossKeys.unitDetail('UC1', false)],
  ['o histórico de uma ordem', lossKeys.orderEvents(1)]
]

const UNAFFECTED_BY_AN_ORDER: Array<[string, QueryKey]> = [
  ['o backtest', lossKeys.backtestSeries()],
  ['a lista de inspetores', lossKeys.inspectors()]
]

async function updateAnOrderWithEverythingCached() {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  for (const [, queryKey] of [...CHANGED_BY_AN_ORDER, ...UNAFFECTED_BY_AN_ORDER]) {
    queryClient.setQueryData(queryKey, [])
  }
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  const { result } = renderHook(() => useUpdateInspectionMutation(), { wrapper })
  result.current.mutate({ idInspecao: 1, payload: { status: 'pendente' } })
  await waitFor(() => expect(result.current.isSuccess).toBe(true))
  return queryClient
}

describe('invalidação depois de mudar uma ordem', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedUpdate.mockResolvedValue(ORDER)
  })

  it.each(CHANGED_BY_AN_ORDER)('refaz %s', async (_description, queryKey) => {
    const queryClient = await updateAnOrderWithEverythingCached()

    expect(queryClient.getQueryState(queryKey)?.isInvalidated).toBe(true)
  })

  it.each(UNAFFECTED_BY_AN_ORDER)('mantém %s, que não depende das ordens', async (_description, queryKey) => {
    const queryClient = await updateAnOrderWithEverythingCached()

    expect(queryClient.getQueryState(queryKey)?.isInvalidated).toBe(false)
  })
})
