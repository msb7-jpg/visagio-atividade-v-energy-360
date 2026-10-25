import { Check, ChevronRight, Copy, Database } from 'lucide-react'
import { useEffect, useState } from 'react'
import { CollapsibleMotion } from '@/components/animations/CollapsibleMotion'
import { Button } from '@/components/ui/button'
import { useCopyToClipboard } from '@/lib/clipboard'
import { cn, handleKeyboardClick } from '@/lib/utils'

/**
 * Propriedades para renderização do bloco de código SQL.
 */
export interface SqlCodeBlockProps {
  /** Texto da consulta SQL formatada. */
  query: string
  /** Classes CSS adicionais. */
  className?: string
}

/**
 * Bloco colapsável com syntax highlighting e botão de cópia para consultas SQL.
 *
 * @param props - Propriedades com a query SQL e estilização.
 * @returns Elemento JSX do card de código SQL interativo.
 */
export function SqlCodeBlock({ query, className }: SqlCodeBlockProps) {
  const [isCopied, copy] = useCopyToClipboard()
  const [highlightedHtml, setHighlightedHtml] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    let isMounted = true
    async function highlight() {
      try {
        const { codeToHtml } = await import('shiki')
        const html = await codeToHtml(query, {
          lang: 'sql',
          theme: 'vitesse-dark'
        })
        if (isMounted) {
          setHighlightedHtml(html)
        }
      } catch {
        if (isMounted) {
          setHighlightedHtml(`<pre><code>${query}</code></pre>`)
        }
      }
    }
    void highlight()
    return () => {
      isMounted = false
    }
  }, [query])

  const handleCopy = (event: React.MouseEvent) => {
    event.stopPropagation()
    void copy(query)
  }

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-xl border border-border bg-card/60 shadow-md backdrop-blur-sm transition-all',
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
        className="flex cursor-pointer select-none items-center justify-between border-b border-border bg-card/80 px-3 py-1.5 transition-colors hover:bg-muted/50"
      >
        <div className="flex items-center gap-2">
          <ChevronRight
            className={cn(
              'size-4 text-muted-foreground transition-transform duration-200',
              isExpanded ? 'rotate-90' : null
            )}
          />
          <Database className="size-3.5 text-primary" />
          <span className="text-xs font-semibold text-foreground">Consulta SQL</span>

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
        <div className="overflow-x-auto border-t border-border bg-muted/20 p-4 font-mono text-xs leading-relaxed text-foreground">
          {highlightedHtml ? (
            // eslint-disable-next-line @eslint-react/dom-no-dangerously-set-innerhtml
            <div dangerouslySetInnerHTML={{ __html: highlightedHtml }} className="[&_pre]:bg-transparent! [&_pre]:p-0!" />
          ) : (
            <pre className="text-muted-foreground">{query}</pre>
          )}
        </div>
      </CollapsibleMotion>
    </div>
  )
}
