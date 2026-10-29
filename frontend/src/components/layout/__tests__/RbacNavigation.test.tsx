import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { homeRouteFor } from '@/routes/homeRoute'

vi.mock('@/features/auth/hooks/useAuth')

describe('RBAC da navegação', () => {
  beforeEach(() => vi.resetAllMocks())

  it.each([
    ['atendente', '/customers'],
    ['diretor', '/dashboard'],
    ['gerente_perdas', '/losses'],
    ['gerente_operacao', '/quality'],
    ['papel_desconhecido', '/login']
  ])('%s abre em %s', (role, path) => {
    expect(homeRouteFor(role)).toBe(path)
  })

  it('ProtectedRoute nega o acesso e oferece o retorno à tela inicial', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { role: 'atendente' },
      isAuthenticated: true,
      isLoading: false
    } as ReturnType<typeof useAuth>)
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route element={<ProtectedRoute allowedRoles={['diretor']} />}>
            <Route path="/dashboard" element={<p>conteudo</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    )
    expect(screen.queryByText('conteudo')).toBeNull()
    expect(screen.getByRole('link', { name: 'Voltar à tela inicial' }).getAttribute('href')).toBe('/customers')
  })
})
