import { lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage } from '@/features/auth/components/LoginPage'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProtectedRoute } from './ProtectedRoute'
import { homeRouteFor } from './homeRoute'

const DashboardPage = lazy(() => import('@/features/auth/components/DashboardPage').then((module) => ({ default: module.DashboardPage })))
const LossManagementPage = lazy(() => import('@/features/loss_management/components/LossManagementPage').then((module) => ({ default: module.LossManagementPage })))
const GridQualityPage = lazy(() => import('@/features/grid_quality/components/GridQualityPage').then((module) => ({ default: module.GridQualityPage })))
const Customer360Page = lazy(() => import('@/features/customer360/components/Customer360Page').then((module) => ({ default: module.Customer360Page })))

// Mesmo RBAC do backend (`LOSS_ROLES` em loss_management/router.py).
const DASHBOARD_ROLES = ['diretor', 'gerente_operacao', 'gerente_perdas']
const LOSS_ROLES = ['diretor', 'gerente_perdas']
const QUALITY_ROLES = ['diretor', 'gerente_operacao']
const CUSTOMER360_ROLES = ['diretor', 'gerente_atendimento', 'atendente', 'gerente_perdas']

/** Leva o usuário logado à tela inicial do cargo; sem sessão, o ProtectedRoute da rota destino manda ao login. */
function HomeRedirect() {
  const { user } = useAuth()
  return <Navigate to={user ? homeRouteFor(user.role) : '/login'} replace />
}

/**
 * Definição central de roteamento da aplicação com separação entre rotas públicas e protegidas.
 *
 * @returns Elemento de roteamento BrowserRouter configurado.
 */
export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* Rotas Protegidas: shell comum, acesso por cargo em cada rota */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route element={<ProtectedRoute allowedRoles={DASHBOARD_ROLES} />}>
              <Route path="/dashboard" element={<DashboardPage />} />
            </Route>
            <Route element={<ProtectedRoute allowedRoles={LOSS_ROLES} />}>
              <Route path="/losses" element={<LossManagementPage />} />
            </Route>
            <Route element={<ProtectedRoute allowedRoles={QUALITY_ROLES} />}>
              <Route path="/quality" element={<GridQualityPage />} />
            </Route>
            <Route element={<ProtectedRoute allowedRoles={CUSTOMER360_ROLES} />}>
              <Route path="/customers" element={<Customer360Page />} />
            </Route>
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<HomeRedirect />} />
      </Routes>
    </BrowserRouter>
  )
}
