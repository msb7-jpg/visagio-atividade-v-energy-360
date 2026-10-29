import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { AppRouteTree } from '@/routes/AppRoutes'

vi.mock('@/features/auth/hooks/useAuth')
vi.mock('@/features/auth/components/LoginPage', () => ({ LoginPage: () => <p>tela:login</p> }))
vi.mock('@/features/executive_dashboard/components/ExecutiveDashboardPage', () => ({ ExecutiveDashboardPage: () => <p>tela:dashboard</p> }))
vi.mock('@/features/loss_management/components/LossManagementPage', () => ({ LossManagementPage: () => <p>tela:losses</p> }))
vi.mock('@/features/grid_quality/components/GridQualityPage', () => ({ GridQualityPage: () => <p>tela:quality</p> }))
vi.mock('@/features/revenue/components/RevenueDashboardPage', () => ({ RevenueDashboardPage: () => <p>tela:revenue</p> }))
vi.mock('@/features/customer360/components/Customer360Page', () => ({ Customer360Page: () => <p>tela:customers</p> }))

const ROUTES = ['/dashboard', '/losses', '/quality', '/customers', '/revenue']

// Tabela esperada: papel -> rotas permitidas e rótulos do menu (na ordem do menu).
const EXPECTED: Record<string, { routes: string[]; menu: string[] }> = {
  diretor: {
    routes: ['/dashboard', '/revenue', '/losses', '/quality', '/customers'],
    menu: ['Painel', 'Inteligência Comercial', 'Fila de Inspeção', 'Qualidade da Rede', 'Visão 360 da UC']
  },
  gerente_operacao: { routes: ['/quality', '/customers'], menu: ['Qualidade da Rede', 'Visão 360 da UC'] },
  gerente_perdas: { routes: ['/losses', '/customers'], menu: ['Fila de Inspeção', 'Visão 360 da UC'] },
  gerente_atendimento: { routes: ['/customers'], menu: ['Visão 360 da UC'] },
  atendente: { routes: ['/customers'], menu: ['Visão 360 da UC'] }
}

const CASES = Object.entries(EXPECTED).flatMap(([role, { routes }]) =>
  ROUTES.map((route) => [role, route, routes.includes(route)] as const)
)

let currentRole = ''

describe('RBAC: papéis x rotas do portal', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockImplementation(() => ({ user: { role: currentRole, nome: 'Teste' }, isAuthenticated: true, isLoading: false, logout: vi.fn() }) as unknown as ReturnType<typeof useAuth>)
  })

  it.each(CASES)('%s em %s: permitido=%s', async (role, route, allowed) => {
    currentRole = role
    render(
      <MemoryRouter initialEntries={[route]}>
        <AppRouteTree />
      </MemoryRouter>
    )
    if (allowed) {
      expect(await screen.findByText(`tela:${route.slice(1)}`)).toBeTruthy()
    } else {
      expect(await screen.findByText('Acesso Restrito')).toBeTruthy()
      expect(screen.queryByText(`tela:${route.slice(1)}`)).toBeNull()
    }
  })

  it.each(Object.entries(EXPECTED))('%s vê no menu apenas os itens esperados', async (role, { routes, menu }) => {
    currentRole = role
    render(
      <MemoryRouter initialEntries={[routes[0]]}>
        <AppRouteTree />
      </MemoryRouter>
    )
    await screen.findByText(`tela:${routes[0].slice(1)}`)
    const links = within(screen.getAllByRole('navigation')[0]).getAllByRole('link')
    expect(links.map((link) => link.textContent)).toEqual(menu)
  })
})
