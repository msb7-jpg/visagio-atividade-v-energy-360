// fallow-ignore-file unused-file
import type { JSX } from 'react'
import { SqlCodeBlock } from '@/features/chat/components/renderers/SqlCodeBlock'

/**
 * Propriedades para a auditoria de consulta SQL legada.
 */
export interface SqlAuditAccordionProps {
  /** Texto da consulta SQL. */
  sql: string
  /** Tempo de execução em milissegundos. */
  durationMs?: number
  /** Quantidade de linhas retornadas. */
  rowCount?: number
}

/**
 * Renderizador de auditoria SQL compatível com SqlCodeBlock.
 *
 * @param props - Propriedades com a query SQL e métricas.
 * @returns Elemento JSX do SqlCodeBlock.
 */
export function SqlAuditAccordion({ sql }: SqlAuditAccordionProps): JSX.Element | null {
  return <SqlCodeBlock query={sql} />
}
