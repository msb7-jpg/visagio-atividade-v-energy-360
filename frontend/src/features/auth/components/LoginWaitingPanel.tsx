import { Check, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LOGIN_STEP_LABELS, type LoginController } from '@/features/auth/hooks/useLoginController'
import { motionClass } from '@/features/auth/lib/motionClass'
import { cn } from '@/lib/utils'

interface LoginWaitingPanelProps {
  controller: LoginController
  reduced: boolean
}

type StepState = 'done' | 'now' | 'wait'

const STEP_TEXT_CLASS: Readonly<Record<StepState, string>> = {
  done: 'text-success',
  now: 'text-foreground font-semibold',
  wait: 'text-muted-foreground'
}

function stepStateOf(position: number, activeStep: number): StepState {
  if (position < activeStep) return 'done'
  return position === activeStep ? 'now' : 'wait'
}

function StepIcon({ state, reduced }: { state: StepState, reduced: boolean }) {
  if (state === 'done') {
    return <Check className={cn('size-4', motionClass(reduced, 'login-anim-check'))} aria-hidden="true" />
  }
  if (state === 'now') {
    return reduced
      ? <Clock className="size-4" aria-hidden="true" />
      : <span className="border-input border-t-primary login-spin size-4 rounded-full border-2" aria-hidden="true" />
  }
  return <span className="border-input size-4 rounded-full border-2" aria-hidden="true" />
}

/**
 * Estado "aguardando": os 3 passos de verificação, que acompanham o estado real do login.
 *
 * @param props - Controlador da tela e preferência de movimento reduzido.
 * @returns Painel de espera com região de status (`aria-live`).
 */
export function LoginWaitingPanel({ controller, reduced }: LoginWaitingPanelProps) {
  const { activeStep } = controller

  return (
    <div className={cn('flex flex-col gap-4', motionClass(reduced, 'login-anim-swap'))}>
      <div>
        <h2 className="text-2xl font-bold">Entrando…</h2>
        <p className="text-muted-foreground mt-1 tabular-nums">{controller.email}</p>
      </div>

      <ol
        role="status"
        aria-live="polite"
        className="border-border bg-card flex flex-col gap-3.5 rounded-lg border p-4"
      >
        {LOGIN_STEP_LABELS.map((label, index) => {
          const state = stepStateOf(index + 1, activeStep)
          return (
            <li
              key={label}
              aria-current={state === 'now' ? 'step' : undefined}
              className={cn(
                'flex items-center gap-2.5 text-sm',
                STEP_TEXT_CLASS[state],
                motionClass(reduced, 'login-anim-step')
              )}
            >
              <StepIcon state={state} reduced={reduced} />
              <span>{label}</span>
            </li>
          )
        })}
      </ol>

      <Button type="button" variant="link" className="self-start" onClick={controller.backToForm}>Cancelar</Button>
    </div>
  )
}
