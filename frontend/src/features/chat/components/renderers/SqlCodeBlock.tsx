import { Check, ChevronRight, Copy, Database } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { CollapsibleMotion } from '@/components/animations/CollapsibleMotion'
import { useTheme } from '@/components/layout/useTheme'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SqlStatementsTabs } from '@/features/chat/components/renderers/SqlStatementsTabs'
import { escapeHtml, highlightSql } from '@/features/chat/components/renderers/sqlHighlighter'
import { splitSqlStatements } from '@/features/chat/components/renderers/sqlStatements'
import { useCopyToClipboard } from '@/lib/clipboard'
import { cn, handleKeyboardClick } from '@/lib/utils'

/**
 * Propriedades para renderização do bloco de código SQL.
 */
export interface SqlCodeBlockProps {
  /** Texto da consulta SQL formatada (simples ou múltiplas instruções em lote). */
  query: string
  /** Classes CSS adicionais. */
  className?: string
}

/**
 * Bloco colapsável com syntax highlighting, alternância de abas multi-query e botão de cópia.
 *
 * @param props - Propriedades com a query SQL e estilização.
 * @returns Elemento JSX do card de código SQL interativo.
 */
export function SqlCodeBlock({ query, className }: SqlCodeBlockProps) {
  const { theme: appTheme } = useTheme()
  const [isCopied, copy] = useCopyToClipboard()
  const [highlightedHtml, setHighlightedHtml] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)

  const statements = useMemo(() => splitSqlStatements(query), [query])
  const [selectedTabId, setSelectedTabId] = useState<string>('sql-stmt-1')

  const resolvedTabId = useMemo(() => {
    if (statements.length <= 1 || selectedTabId === 'all') {
      return selectedTabId
    }
    const exists = statements.some(stmt => stmt.id === selectedTabId)
    return exists ? selectedTabId : statements[0].id
  }, [selectedTabId, statements])

  const activeSql = useMemo(() => {
    if (statements.length <= 1 || resolvedTabId === 'all') {
      return query
    }
    const found = statements.find(stmt => stmt.id === resolvedTabId)
    return found ? found.sql : query
  }, [query, resolvedTabId, statements])

  useEffect(() => {
    let isMounted = true
    async function highlight() {
      try {
        const html = await highlightSql(activeSql, appTheme === 'escuro')
        if (isMounted) {
          setHighlightedHtml(html)
        }
      } catch {
        if (isMounted) {
          setHighlightedHtml(`<pre><code>${escapeHtml(activeSql)}</code></pre>`)
        }
      }
    }
    void highlight()
    return () => {
      isMounted = false
    }
  }, [activeSql, appTheme])

  const handleCopy = (event: React.MouseEvent) => {
    event.stopPropagation()
    void copy(activeSql)
  }

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-lg border border-border bg-card shadow-sm transition',
        className
      )}
    >
      <div
        role="button"
        tabIndex={0}
        aria-label="Alternar exibição da consulta SQL"
        aria-expanded={isExpanded}
        onClick={() => setIsExpanded(prev => !prev)}
        onKeyDown={event => handleKeyboardClick(event, () => setIsExpanded(prev => !prev))}
        className="flex cursor-pointer select-none items-center justify-between border-b border-border bg-card px-3 py-1.5 transition-colors hover:bg-muted/50"
      >
        <div className="flex items-center gap-2">
          <ChevronRight
            className={cn(
              'size-4 text-muted-foreground transition-transform duration-200',
              isExpanded ? 'rotate-90' : null
            )}
          />
          <Database className="size-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold text-foreground">Consulta SQL</span>
          {statements.length > 1 ? (
            <Badge variant="outline">
              {statements.length}
              {' '}
              consultas
            </Badge>
          ) : null}
          <span className="text-xs text-muted-foreground">
            {isExpanded ? '(clique para recolher)' : '(clique para expandir)'}
          </span>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          aria-label="Copiar consulta SQL"
        >
          {isCopied ? (
            <span className="flex items-center gap-1.5 text-success text-xs">
              <Check className="size-3.5" />
              <span>Copiado!</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-muted-foreground text-xs">
              <Copy className="size-3.5" />
              <span>Copiar</span>
            </span>
          )}
        </Button>
      </div>

      <CollapsibleMotion isExpanded={isExpanded}>
        <SqlStatementsTabs
          statements={statements}
          activeId={resolvedTabId}
          onSelect={setSelectedTabId}
        />
        <div className="overflow-x-auto border-t border-border bg-muted/20 p-4 font-mono text-xs leading-relaxed text-foreground">
          {highlightedHtml ? (
            // Injeção segura: highlightedHtml é gerado exclusivamente pelo Shiki
            // a partir do código SQL somente-leitura validado pela AST do backend.
            // eslint-disable-next-line @eslint-react/dom-no-dangerously-set-innerhtml
            <div dangerouslySetInnerHTML={{ __html: highlightedHtml }} className="[&_pre]:bg-transparent! [&_pre]:p-0!" />
          ) : (
            <pre className="text-muted-foreground">{activeSql}</pre>
          )}
        </div>
      </CollapsibleMotion>
    </div>
  )
}
