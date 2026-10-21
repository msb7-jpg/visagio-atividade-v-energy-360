import type { ReactNode } from 'react'
import { AlertTriangle, Inbox } from 'lucide-react'
import { EmptyState } from '@/components/feedback/EmptyState'
import { LoadingSkeleton } from '@/components/feedback/LoadingSkeleton'

interface AsyncListStateProps {
  isLoading: boolean
  isError: boolean
  isEmpty: boolean
  errorTitle: string
  errorDescription: string
  emptyTitle: string
  emptyDescription: string
  children: ReactNode
}

/**
 * Estados padronizados de uma lista remota: carregando, erro, vazia ou com dados.
 *
 * @param props - Flags da query, textos de erro/vazio e conteúdo com dados.
 * @returns Skeleton, estado vazio/erro ou o conteúdo da lista.
 */
export function AsyncListState({
  isLoading,
  isError,
  isEmpty,
  errorTitle,
  errorDescription,
  emptyTitle,
  emptyDescription,
  children
}: AsyncListStateProps) {
  if (isLoading) {
    return <LoadingSkeleton count={5} className="h-8" />
  }
  if (isError) {
    return <EmptyState title={errorTitle} description={errorDescription} icon={<AlertTriangle className="size-10" />} />
  }
  if (isEmpty) {
    return <EmptyState title={emptyTitle} description={emptyDescription} icon={<Inbox className="size-10" />} />
  }
  return children
}
