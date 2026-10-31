import { ChevronRight, Workflow } from 'lucide-react'
import { useState, type JSX } from 'react'
import { CollapsibleMotion } from '@/components/animations/CollapsibleMotion'
import { StaggerItem } from '@/components/animations/StaggerList'
import { StepItem } from '@/features/chat/components/feed/StepItem'
import { resolveDisplaySteps } from '@/features/chat/components/feed/nodeStepperUtils'
import type { AgentStepItem } from '@/features/chat/types/chat.types'
import { cn, handleKeyboardClick } from '@/lib/utils'

/**
 * Propriedades para o componente de visualização das etapas de execução do agente.
 */
export interface NodeStepperProps {
  /** Lista ordenada de etapas intermediárias observadas durante a resposta. */
  steps: AgentStepItem[]
  /**
   * Indica se a resposta ainda está em geração de streaming.
   * @defaultValue `false`
   */
  isStreaming?: boolean
  /** Classes CSS adicionais para customização de layout. */
  className?: string
}

/**
 * Componente sanfonado que exibe as etapas e latências de raciocínio do pipeline do agente.
 *
 * @param props - Propriedades de configuração dos passos e estado de streaming.
 * @returns Elemento JSX colapsável da timeline ou nulo se não houver etapas.
 */
export function NodeStepper({
  steps,
  isStreaming = false,
  className
}: NodeStepperProps): JSX.Element | null {
  const [isExpanded, setIsExpanded] = useState(true)

  if (steps.length === 0 && !isStreaming) return null

  const displaySteps = resolveDisplaySteps(steps, isStreaming)

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-xl border border-border bg-card/60 shadow-md backdrop-blur-sm transition',
        className
      )}
    >
      <div
        role="button"
        tabIndex={0}
        aria-label="Alternar exibição das etapas de processamento"
        aria-expanded={isExpanded}
        onClick={() => setIsExpanded(prev => !prev)}
        onKeyDown={event => handleKeyboardClick(event, () => setIsExpanded(prev => !prev))}
        className="flex cursor-pointer select-none items-center justify-between border-b border-border bg-card/80 px-3 py-2 transition-colors hover:bg-muted/50"
      >
        <div className="flex min-w-0 items-center gap-2">
          <ChevronRight
            className={cn(
              'size-4 shrink-0 text-muted-foreground transition-transform duration-200',
              isExpanded ? 'rotate-90' : null
            )}
          />
          <Workflow className="size-3.5 shrink-0 text-primary" />
          <span className="truncate text-xs font-semibold text-foreground">
            Etapas de Processamento
          </span>

          <span className="shrink-0 text-xs text-muted-foreground">
            {isExpanded ? '(clique para recolher)' : '(clique para expandir)'}
          </span>
        </div>
      </div>

      <CollapsibleMotion isExpanded={isExpanded}>
        <div className="border-t border-border bg-muted/20 p-3">
          <div className="relative space-y-3 pl-1">
            {displaySteps.map((step, index) => (
              <StaggerItem key={`${step.step}-${String(index)}`} delay={index * 0.04}>
                <StepItem step={step} isLast={index === displaySteps.length - 1} />
              </StaggerItem>
            ))}
          </div>
        </div>
      </CollapsibleMotion>
    </div>
  )
}
