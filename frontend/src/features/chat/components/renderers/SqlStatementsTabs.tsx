import type { JSX } from 'react'
import { Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { SqlStatementItem } from '@/features/chat/components/renderers/sqlStatements'

/**
 * Propriedades do seletor de abas para múltiplas instruções SQL.
 */
export interface SqlStatementsTabsProps {
  /** Lista de instruções SQL individuais extraídas do turno analítico. */
  statements: SqlStatementItem[]
  /** Identificador da aba ativa ('all' ou o id de uma instrução específica). */
  activeId: string
  /** Callback acionado ao trocar a aba selecionada. */
  onSelect: (selectedId: string) => void
}

/**
 * Barra de alternância visual entre múltiplas consultas SQL executadas em lote.
 *
 * @param props - Propriedades contendo as consultas e estado de seleção.
 * @returns Elemento JSX com os botões de abas ou null quando houver apenas uma consulta.
 */
export function SqlStatementsTabs({
  statements,
  activeId,
  onSelect
}: SqlStatementsTabsProps): JSX.Element | null {
  if (statements.length <= 1) {
    return null
  }

  return (
    <div
      role="tablist"
      aria-label="Consultas SQL executadas no lote"
      className="flex flex-wrap items-center gap-1 border-t border-border bg-muted/40 px-2.5 py-1.5"
    >
      {statements.map(statement => (
        <Button
          key={statement.id}
          type="button"
          role="tab"
          aria-selected={activeId === statement.id}
          size="sm"
          variant={activeId === statement.id ? 'secondary' : 'ghost'}
          onClick={() => onSelect(statement.id)}
        >
          <span className="truncate text-xs">{statement.title}</span>
        </Button>
      ))}
      <Button
        type="button"
        role="tab"
        aria-selected={activeId === 'all'}
        size="sm"
        variant={activeId === 'all' ? 'secondary' : 'ghost'}
        onClick={() => onSelect('all')}
      >
        <span className="flex items-center gap-1 text-xs">
          <Layers className="size-3 shrink-0" />
          <span>Todas ({statements.length})</span>
        </span>
      </Button>
    </div>
  )
}
