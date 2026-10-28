import { Component, type ErrorInfo, type ReactNode } from 'react'
import { ErrorState } from '@/components/feedback/ErrorState'

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
        <ErrorState
          scope="page"
          title="Algo deu errado na interface"
          description="Ocorreu um erro inesperado ao carregar este componente."
          detail={this.state.error?.message}
          onRetry={() => this.setState({ hasError: false, error: null })}
        />
      )
    }

    return this.props.children
  }
}
