import type { ReactNode } from 'react'
import { Inbox } from 'lucide-react'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { LoadingSkeleton } from '@/components/feedback/LoadingSkeleton'

interface AsyncStateProps {
  isLoading: boolean
  isError: boolean
  isEmpty?: boolean
  errorTitle: string
  errorDescription?: string
  errorDetail?: string
  onRetry?: () => void
  emptyTitle?: string
  emptyDescription?: string
  emptyIcon?: ReactNode
  skeletonCount?: number
  children: ReactNode
}

/**
 * Estados padronizados de um bloco que depende da API: carregando, erro, vazio ou conteúdo.
 * Compartilhado pelas telas do portal para que todas tratem carregamento e falha do mesmo jeito.
 *
 * @param props - Flags da consulta, textos de erro (com detalhe técnico e nova tentativa opcionais), de vazio e o conteúdo com dados.
 * @returns Skeleton, aviso de erro, estado vazio ou o conteúdo.
 */
export function AsyncState({
  isLoading,
  isError,
  isEmpty = false,
  errorTitle,
  errorDescription,
  errorDetail,
  onRetry,
  emptyTitle = 'Nenhum dado encontrado',
  emptyDescription,
  emptyIcon,
  skeletonCount = 4,
  children
}: AsyncStateProps) {
  if (isLoading) {
    return <LoadingSkeleton count={skeletonCount} className="h-8" />
  }
  if (isError) {
    return <ErrorState title={errorTitle} description={errorDescription} detail={errorDetail} onRetry={onRetry} />
  }
  if (isEmpty) {
    return <EmptyState title={emptyTitle} description={emptyDescription} icon={emptyIcon ?? <Inbox className="size-10" />} />
  }
  return children
}
