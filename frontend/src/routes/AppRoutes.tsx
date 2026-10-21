import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage } from '@/features/auth/components/LoginPage'
import { DashboardPage } from '@/features/auth/components/DashboardPage'
import { Customer360Page } from '@/features/customer360/components/Customer360Page'
import { ProtectedRoute } from './ProtectedRoute'

const CUSTOMER360_ROLES = ['diretor', 'gerente_atendimento', 'atendente', 'gerente_perdas']

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
        <Route element={<ProtectedRoute allowedRoles={CUSTOMER360_ROLES} />}>
          <Route path="/customers" element={<Customer360Page />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
