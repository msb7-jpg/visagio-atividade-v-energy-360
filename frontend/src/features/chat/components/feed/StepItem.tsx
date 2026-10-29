import { CheckCircle2, Clock, Loader2, XCircle } from 'lucide-react'
import type { JSX } from 'react'
import { STEP_STATUS, type AgentStepItem } from '@/features/chat/types/chat.types'
import { cn } from '@/lib/utils'

/**
 * Propriedades para renderização de um item individual da linha do tempo do agente.
 */
export interface StepItemProps {
  /** Metadados da etapa com identificador, rótulo, status e duração. */
  step: AgentStepItem
  /** Se `true`, indica que este é o último passo da lista, ocultando a linha conectora inferior. */
  isLast: boolean
}

interface StepStatusVisual {
  badgeClass: string
  textClass: string
  icon: JSX.Element
}

const STEP_STATUS_MAP: Record<string, StepStatusVisual> = {
  [STEP_STATUS.DONE]: {
    badgeClass: 'border-success/40 bg-success/10 text-success',
    textClass: 'text-foreground',
    icon: <CheckCircle2 className="size-3.5" />
  },
  [STEP_STATUS.ACTIVE]: {
    badgeClass: 'border-primary/50 bg-primary/15 text-primary shadow-sm shadow-primary/20',
    textClass: 'text-primary font-semibold animate-pulse',
    icon: <Loader2 className="size-3.5 animate-spin" />
  },
  [STEP_STATUS.ERROR]: {
    badgeClass: 'border-destructive/40 bg-destructive/10 text-destructive',
    textClass: 'text-destructive',
    icon: <XCircle className="size-3.5" />
  }
}

const DEFAULT_STEP_VISUAL: StepStatusVisual = {
  badgeClass: 'border-border bg-card text-muted-foreground',
  textClass: 'text-muted-foreground',
  icon: <Clock className="size-3.5" />
}

/**
 * Item visual representando uma etapa atômica de raciocínio ou execução do agente.
 *
 * @param props - Propriedades contendo o passo e flag de último elemento.
 * @returns Elemento JSX do passo com ícones de estado e tempo de execução.
 */
export function StepItem({ step, isLast }: StepItemProps): JSX.Element {
  const isDone = step.status === STEP_STATUS.DONE
  const visual = STEP_STATUS_MAP[step.status] ?? DEFAULT_STEP_VISUAL

  return (
    <div className="relative flex items-start gap-3">
      {!isLast ? (
        <div
          className={cn(
            'absolute -ml-px left-3 top-5 bottom-0 h-full w-px transition-colors',
            isDone ? 'bg-success/30' : 'bg-border'
          )}
        />
      ) : null}

      <div
        className={cn(
          'relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full border text-xs transition-colors',
          visual.badgeClass
        )}
      >
        {visual.icon}
      </div>

      <div className="flex flex-1 items-center justify-between pt-0.5">
        <span className={cn('text-xs font-medium transition-colors', visual.textClass)}>
          {step.label}
        </span>

        {step.duration_ms !== undefined && step.duration_ms > 0 ? (
          <span className="font-mono text-xs text-muted-foreground">
            {step.duration_ms}ms
          </span>
        ) : null}
      </div>
    </div>
  )
}
