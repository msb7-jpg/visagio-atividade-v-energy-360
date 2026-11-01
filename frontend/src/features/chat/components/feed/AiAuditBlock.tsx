import { ChevronRight, ShieldCheck } from 'lucide-react'
import { useState, type JSX } from 'react'
import { CollapsibleMotion } from '@/components/animations/CollapsibleMotion'
import { NodeStepper } from '@/features/chat/components/feed/NodeStepper'
import { SqlCodeBlock } from '@/features/chat/components/renderers/SqlCodeBlock'
import { ThoughtInspector } from '@/features/chat/components/renderers/ThoughtInspector'
import type { AgentStepItem } from '@/features/chat/types/chat.types'
import { cn, handleKeyboardClick } from '@/lib/utils'

export interface AiAuditBlockProps {
  steps?: AgentStepItem[]
  thought?: string | null
  sql?: string | null
  isStreaming?: boolean
  className?: string
}

/**
 * Bloco de auditoria técnica da IA recolhido por padrão.
 * Agrupa etapas de execução da FSM, raciocínio interno e consulta SQL.
 */
export function AiAuditBlock({
  steps = [],
  thought,
  sql,
  isStreaming = false,
  className
}: AiAuditBlockProps): JSX.Element | null {
  const [isExpanded, setIsExpanded] = useState(false)
  const hasContent = steps.length > 0 || Boolean(thought) || Boolean(sql)

  if (!hasContent) {
    return null
  }

  const toggleExpanded = () => setIsExpanded(prev => !prev)

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-xl border border-border/70 bg-card/40 shadow-sm backdrop-blur-sm transition-all',
        className
      )}
    >
      <div
        role="button"
        tabIndex={0}
        aria-label="Alternar exibição da auditoria técnica da IA"
        aria-expanded={isExpanded}
        onClick={toggleExpanded}
        onKeyDown={event => handleKeyboardClick(event, toggleExpanded)}
        className="flex cursor-pointer select-none items-center justify-between border-b border-border/40 bg-card/60 px-3 py-2 transition-colors hover:bg-muted/40"
      >
        <div className="flex min-w-0 items-center gap-2">
          <ChevronRight
            className={cn(
              'size-4 shrink-0 text-muted-foreground transition-transform duration-200',
              isExpanded ? 'rotate-90' : null
            )}
          />
          <ShieldCheck className="size-4 shrink-0 text-primary" />
          <span className="truncate text-xs font-semibold text-foreground">
            Ver raciocínio da IA (Auditoria)
          </span>
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">
          {isExpanded ? '(clique para recolher)' : '(clique para expandir)'}
        </span>
      </div>

      <CollapsibleMotion isExpanded={isExpanded}>
        <div className="flex flex-col gap-2.5 border-t border-border/40 bg-muted/10 p-3">
          {steps.length > 0 ? (
            <NodeStepper steps={steps} isStreaming={isStreaming} />
          ) : null}
          {thought ? <ThoughtInspector thought={thought} /> : null}
          {sql ? <SqlCodeBlock query={sql} /> : null}
        </div>
      </CollapsibleMotion>
    </div>
  )
}
