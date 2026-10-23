import { Link, Navigate, Outlet, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { homeRouteFor } from './homeRoute'

interface ProtectedRouteProps {
  allowedRoles?: string[]
}

/**
 * Rota protegida com controle de acesso RBAC baseado nos cargos do usuário.
 *
 * @param props - Propriedades com lista de cargos autorizados.
 * @returns Elemento Outlet para sub-rotas autorizadas ou redirecionamento para login.
 */
export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="bg-background text-foreground flex min-h-dvh items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="border-primary size-8 animate-spin rounded-full border-2 border-t-transparent" />
          <span className="text-muted-foreground text-xs">Verificando sessão...</span>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center p-6 text-center">
        <h2 className="text-destructive text-xl font-bold">Acesso Restrito</h2>
        <p className="text-muted-foreground mt-2 text-sm">
          Seu perfil ({user.role}) não tem permissão para visualizar esta tela.
        </p>
        <Button asChild className="mt-4">
          <Link to={homeRouteFor(user.role)}>Voltar à tela inicial</Link>
        </Button>
      </div>
    )
  }

  return <Outlet />
}
