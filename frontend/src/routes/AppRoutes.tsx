import { lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage } from '@/features/auth/components/LoginPage'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { AppLayout } from '@/components/layout/AppLayout'
import { NAV_ITEMS } from '@/components/layout/navItems'
import { ProtectedRoute } from './ProtectedRoute'
import { homeRouteFor } from './homeRoute'

const ExecutiveDashboardPage = lazy(() => import('@/features/executive_dashboard/components/ExecutiveDashboardPage').then((module) => ({ default: module.ExecutiveDashboardPage })))
const LossManagementPage = lazy(() => import('@/features/loss_management/components/LossManagementPage').then((module) => ({ default: module.LossManagementPage })))
const GridQualityPage = lazy(() => import('@/features/grid_quality/components/GridQualityPage').then((module) => ({ default: module.GridQualityPage })))
const RevenueDashboardPage = lazy(() => import('@/features/revenue/components/RevenueDashboardPage').then((module) => ({ default: module.RevenueDashboardPage })))
const Customer360Page = lazy(() => import('@/features/customer360/components/Customer360Page').then((module) => ({ default: module.Customer360Page })))

// Fonte única do RBAC das telas: NAV_ITEMS (espelha `backend/app/shared/role_groups.py`).
const rolesOf = (path: string) => [...(NAV_ITEMS.find((item) => item.path === path)?.roles ?? [])]

/** Leva o usuário logado à tela inicial do cargo; sem sessão, o ProtectedRoute da rota destino manda ao login. */
function HomeRedirect() {
  const { user } = useAuth()
  return <Navigate to={user ? homeRouteFor(user.role) : '/login'} replace />
}

/**
 * Definição central de roteamento da aplicação com separação entre rotas públicas e protegidas.
 *
 * @returns Elemento Routes, sem roteador (permite testar com MemoryRouter).
 */
export function AppRouteTree() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* Rotas Protegidas: shell comum, acesso por cargo em cada rota */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route element={<ProtectedRoute allowedRoles={rolesOf('/dashboard')} />}>
            <Route path="/dashboard" element={<ExecutiveDashboardPage />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={rolesOf('/losses')} />}>
            <Route path="/losses" element={<LossManagementPage />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={rolesOf('/quality')} />}>
            <Route path="/quality" element={<GridQualityPage />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={rolesOf('/revenue')} />}>
            <Route path="/revenue" element={<RevenueDashboardPage />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={rolesOf('/customers')} />}>
            <Route path="/customers" element={<Customer360Page />} />
          </Route>
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  )
}

/** Roteador do navegador sobre a árvore de rotas. */
export function AppRoutes() {
  return (
    <BrowserRouter>
      <AppRouteTree />
    </BrowserRouter>
  )
}
