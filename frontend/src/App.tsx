import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/query-client'
import { AuthProvider } from '@/features/auth/context/AuthProvider'
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary'
import { AppRoutes } from '@/routes/AppRoutes'

/**
 * Componente raiz da aplicação V-Energy Grid 360.
 *
 * @returns Elemento raiz encapsulado com Provedores e ErrorBoundary.
 */
export function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
