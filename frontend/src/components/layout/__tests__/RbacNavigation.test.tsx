import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { navItemsFor } from '@/components/layout/navItems'
import { SidebarNav } from '@/components/layout/SidebarNav'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { homeRouteFor } from '@/routes/homeRoute'

vi.mock('@/features/auth/hooks/useAuth')

function renderSidebarAs(role: string) {
  vi.mocked(useAuth).mockReturnValue({ user: { role } } as ReturnType<typeof useAuth>)
  render(
    <MemoryRouter>
      <SidebarNav />
    </MemoryRouter>
  )
}

describe('RBAC da navegação', () => {
  beforeEach(() => vi.resetAllMocks())

  it.each([
    ['atendente', ['Visão 360 da UC']],
    ['gerente_atendimento', ['Visão 360 da UC']],
    ['gerente_operacao', ['Qualidade da Rede']],
    ['gerente_perdas', ['Gestão de Perdas', 'Visão 360 da UC']],
    ['diretor', ['Painel', 'Inteligência Comercial', 'Gestão de Perdas', 'Qualidade da Rede', 'Visão 360 da UC']],
    ['papel_desconhecido', []]
  ])('%s vê apenas os itens permitidos', (role, labels) => {
    expect(navItemsFor(role).map((item) => item.label)).toEqual(labels)
  })

  it('SidebarNav oculta Qualidade e Perdas para atendente', () => {
    renderSidebarAs('atendente')
    expect(screen.getByRole('link', { name: 'Visão 360 da UC' })).toBeTruthy()
    expect(screen.queryByRole('link', { name: 'Qualidade da Rede' })).toBeNull()
    expect(screen.queryByRole('link', { name: 'Gestão de Perdas' })).toBeNull()
  })

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
