import { LoginBrandPanel } from '@/features/auth/components/LoginBrandPanel'
import { LoginFormPanel } from '@/features/auth/components/LoginFormPanel'
import { LoginNoProfilePanel } from '@/features/auth/components/LoginNoProfilePanel'
import { LoginSuccessPanel } from '@/features/auth/components/LoginSuccessPanel'
import { LoginWaitingPanel } from '@/features/auth/components/LoginWaitingPanel'
import { useLoginController } from '@/features/auth/hooks/useLoginController'
import { useReducedMotion } from '@/features/auth/hooks/useReducedMotion'
import { motionClass } from '@/features/auth/lib/motionClass'
import { cn } from '@/lib/utils'

/**
 * Tela de login (design.md): painel de marca à esquerda e, à direita, o estado atual do acesso
 * (formulário, aguardando, logado ou sem perfil). A autenticação é a real (`POST /auth/login`).
 *
 * @returns Elemento LoginPage renderizado.
 */
export function LoginPage() {
  const controller = useLoginController()
  const reduced = useReducedMotion()
  const { stage, profile } = controller

  return (
    <main className={cn('bg-background text-foreground grid min-h-dvh lg:grid-cols-2', motionClass(reduced, 'login-motion'))}>
      <LoginBrandPanel reduced={reduced} />
      <section
        aria-labelledby={stage === 'form' ? 'login-title' : undefined}
        className="flex items-center justify-center p-6"
      >
        <div className={cn('w-full max-w-md', motionClass(reduced, 'login-anim-panel'))}>
          {stage === 'form' ? <LoginFormPanel controller={controller} reduced={reduced} /> : null}
          {stage === 'wait' ? <LoginWaitingPanel controller={controller} reduced={reduced} /> : null}
          {stage === 'ok' && profile ? (
            <LoginSuccessPanel profile={profile} reduced={reduced} onSwitchAccount={controller.backToForm} />
          ) : null}
          {stage === 'noprofile' ? (
            <LoginNoProfilePanel email={controller.email} reduced={reduced} onBack={controller.backToForm} />
          ) : null}
        </div>
      </section>
    </main>
  )
}
