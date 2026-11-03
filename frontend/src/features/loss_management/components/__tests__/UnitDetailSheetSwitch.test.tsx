import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { lossApi } from '@/features/loss_management/api/lossApi'
import { UnitDetailSheet } from '@/features/loss_management/components/UnitDetailSheet'
import type { UnitDetail } from '@/features/loss_management/types/unitDetailTypes'

vi.mock('@/features/loss_management/api/lossApi', () => ({ lossApi: { getUnitDetail: vi.fn() } }))
vi.mock('@/features/auth/hooks/useAuth')

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

function buildDetail(idUc: string): UnitDetail {
  return {
    id_uc: idUc,
    municipio: 'Olinda',
    bairro: 'Casa Caiada',
    classe_consumo: 'Residencial',
    situacao: 'na_fila',
    competencia_referencia: '2026-06',
    motivos: ['queda_subita'],
    motivo_resumo: 'Queda no consumo.',
    consumo_base_kwh: 300,
    consumo_recente_kwh: 50,
    decomposicao_score: {
      kwh_mes_recuperavel: 1840,
      meses_janela_recuperacao: 3,
      kwh_janela_recuperavel: 5520,
      probabilidade_acerto: 0.93,
      kwh_esperado: 5133.6,
      maior_kwh_esperado_fila: 6000,
      score: 86
    },
    consumo_mensal: [{ competencia: '2026-05', consumo_kwh: 300 }],
    inspecoes_anteriores: []
  }
}

describe('Painel de detalhe da UC: troca de UC com o painel aberto', () => {
  beforeAll(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverStub)
  })

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuth).mockReturnValue({ user: { role: 'gerente_perdas' } } as ReturnType<typeof useAuth>)
    vi.mocked(lossApi.getUnitDetail).mockImplementation(async (idUc) => buildDetail(idUc))
  })

  it('volta aos 12 meses quando a UC aberta muda sem fechar o painel', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const sheet = (idUc: string) => (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <UnitDetailSheet idUc={idUc} onClose={vi.fn()} onGenerateOrder={vi.fn()} />
        </MemoryRouter>
      </QueryClientProvider>
    )
    const { rerender } = render(sheet('UC100002'))

    fireEvent.click(await screen.findByRole('tab', { name: 'Tudo' }))
    await waitFor(() => expect(lossApi.getUnitDetail).toHaveBeenCalledWith('UC100002', true, expect.anything()))

    rerender(sheet('UC100003'))

    await waitFor(() => expect(lossApi.getUnitDetail).toHaveBeenCalledWith('UC100003', false, expect.anything()))
    expect(lossApi.getUnitDetail).not.toHaveBeenCalledWith('UC100003', true, expect.anything())
  })
})
