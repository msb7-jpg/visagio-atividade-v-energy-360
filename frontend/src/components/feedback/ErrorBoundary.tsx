import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * Barreira de erro para isolamento de exceções no ciclo de renderização React.
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary capturou erro:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex min-h-72 flex-col items-center justify-center p-6 text-center">
          <h2 className="text-destructive text-lg font-semibold">Algo deu errado na interface</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            {this.state.error?.message || 'Ocorreu um erro inesperado ao carregar este componente.'}
          </p>
          <div className="mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              Tentar Novamente
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
