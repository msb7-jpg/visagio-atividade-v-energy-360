import { Badge } from '@/components/ui/badge'
import { STEP_STATUS, type AgentStepItem } from '@/features/chat/types/chat.types'

interface AgentStepProgressProps {
  steps?: AgentStepItem[]
}

function resolveVariant(status: string): 'destructive' | 'default' | 'secondary' {
  if (status === STEP_STATUS.ERROR) return 'destructive'
  if (status === STEP_STATUS.DONE) return 'default'
  return 'secondary'
}

/**
 * Exibe o progresso cronológico dos nós executados pelo agente LangGraph.
 *
 * @param props - Propriedades contendo as etapas executadas.
 * @returns Componente com os badges das etapas.
 */
export function AgentStepProgress({ steps }: AgentStepProgressProps) {
  if (!steps || steps.length === 0) return null

  return (
    <div className="flex flex-col gap-1.5 py-2">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Execução da FSM LangGraph
      </span>
      <div className="flex flex-wrap gap-2">
        {steps.map(item => {
          const badgeVariant = resolveVariant(item.status)

          return (
            <Badge key={item.step} variant={badgeVariant}>
              {item.label}
              {item.duration_ms ? ` (${item.duration_ms}ms)` : null}
            </Badge>
          )
        })}
      </div>
    </div>
  )
}
