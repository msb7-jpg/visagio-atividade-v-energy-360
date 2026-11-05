import { ChevronDown, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface InsightActionsProps {
  hasDetails: boolean
  isCollapsed: boolean
  isFetching: boolean
  onToggle: () => void
  onRefresh: () => void
}

/**
 * Botões do topo do resumo da IA: mostrar ou ocultar os pontos de apoio e gerar o resumo de novo.
 *
 * @param props - Estado do detalhe e da consulta, e os callbacks.
 * @returns Os dois botões; o de detalhes só aparece quando há pontos de apoio.
 */
export function InsightActions({ hasDetails, isCollapsed, isFetching, onToggle, onRefresh }: InsightActionsProps) {
  return (
    <>
      {hasDetails ? (
        <Button variant="ghost" size="sm" onClick={onToggle} aria-expanded={!isCollapsed}>
          {isCollapsed ? 'Ver detalhes' : 'Ocultar'}
          <ChevronDown aria-hidden="true" className={cn('transition-transform', isCollapsed ? null : 'rotate-180')} />
        </Button>
      ) : null}
      <Button
        variant="ghost"
        size="icon"
        disabled={isFetching}
        title="Gerar o resumo de novo"
        aria-label="Gerar o resumo de novo"
        onClick={onRefresh}
      >
        <RotateCw className={cn(isFetching ? 'animate-spin' : null)} />
      </Button>
    </>
  )
}
