import type { ReactNode } from 'react'
import { CloudOff } from 'lucide-react'
import { EmptyState } from '@/components/feedback/EmptyState'
import { LoadingSkeleton } from '@/components/feedback/LoadingSkeleton'

interface QuerySectionProps<TData> {
  data: TData | undefined
  isError: boolean
  errorTitle: string
  children: (data: TData) => ReactNode
}

/**
 * Renderiza um bloco da Visão 360 conforme o estado da consulta: carregando, erro ou dados prontos.
 *
 * @param props - Dados da consulta, flag de erro, título do erro e função que desenha os dados.
 * @returns Skeleton, aviso de erro ou o conteúdo do bloco.
 */
export function QuerySection<TData>({ data, isError, errorTitle, children }: QuerySectionProps<TData>) {
  if (isError) {
    return (
      <EmptyState
        title={errorTitle}
        description="Verifique a conexão com a API e tente buscar a unidade novamente."
        icon={<CloudOff className="size-10" />}
      />
    )
  }
  if (data === undefined) {
    return <LoadingSkeleton count={4} className="h-10" />
  }
  return children(data)
}
