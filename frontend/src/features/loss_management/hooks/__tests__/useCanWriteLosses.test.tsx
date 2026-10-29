import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useCanWriteLosses } from '@/features/loss_management/hooks/useCanWriteLosses'

vi.mock('@/features/auth/hooks/useAuth')

function signInAs(user: { role: string } | null) {
  vi.mocked(useAuth).mockReturnValue({ user } as ReturnType<typeof useAuth>)
}

describe('useCanWriteLosses', () => {
  beforeEach(() => vi.resetAllMocks())

  it('libera a escrita para o gerente de perdas', () => {
    signInAs({ role: 'gerente_perdas' })

    expect(renderHook(() => useCanWriteLosses()).result.current).toBe(true)
  })

  it.each(['diretor', 'gerente_operacao', 'gerente_atendimento', 'atendente', 'papel_desconhecido'])(
    'não libera a escrita para %s',
    (role) => {
      signInAs({ role })

      expect(renderHook(() => useCanWriteLosses()).result.current).toBe(false)
    }
  )

  it('não libera a escrita sem usuário logado', () => {
    signInAs(null)

    expect(renderHook(() => useCanWriteLosses()).result.current).toBe(false)
  })
})
