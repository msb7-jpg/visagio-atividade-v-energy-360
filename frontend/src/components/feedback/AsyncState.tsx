import type { ReactNode } from 'react'
import { AlertTriangle, Inbox } from 'lucide-react'
import { EmptyState } from '@/components/feedback/EmptyState'
import { LoadingSkeleton } from '@/components/feedback/LoadingSkeleton'

interface AsyncStateProps {
  isLoading: boolean
  isError: boolean
  isEmpty?: boolean
  errorTitle: string
  errorDescription?: string
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
 * @param props - Flags da consulta, textos de erro e de vazio e o conteúdo com dados.
 * @returns Skeleton, aviso de erro, estado vazio ou o conteúdo.
 */
export function AsyncState({
  isLoading,
  isError,
  isEmpty = false,
  errorTitle,
  errorDescription,
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
    return <EmptyState title={errorTitle} description={errorDescription} icon={<AlertTriangle className="size-10" />} />
  }
  if (isEmpty) {
    return <EmptyState title={emptyTitle} description={emptyDescription} icon={emptyIcon ?? <Inbox className="size-10" />} />
  }
  return children
}
