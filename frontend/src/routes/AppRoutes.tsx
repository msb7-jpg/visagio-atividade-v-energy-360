import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage } from '@/features/auth/components/LoginPage'
import { DashboardPage } from '@/features/auth/components/DashboardPage'
import { LossManagementPage } from '@/features/loss_management/components/LossManagementPage'
import { ProtectedRoute } from './ProtectedRoute'

// Mesmo RBAC do backend (`LOSS_ROLES` em loss_management/router.py).
const LOSS_ROLES = ['diretor', 'gerente_perdas']

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

        {/* Rotas Protegidas */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={LOSS_ROLES} />}>
          <Route path="/losses" element={<LossManagementPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
