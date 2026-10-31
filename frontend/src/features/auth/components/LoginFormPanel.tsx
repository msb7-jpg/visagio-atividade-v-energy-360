import type { SyntheticEvent } from 'react'
import { ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { LoginDemoAccess } from '@/features/auth/components/LoginDemoAccess'
import type { LoginController } from '@/features/auth/hooks/useLoginController'
import { motionClass } from '@/features/auth/lib/motionClass'
import { cn } from '@/lib/utils'

interface LoginFormPanelProps {
  controller: LoginController
  reduced: boolean
}

/**
 * Estado "formulário": SSO, e-mail e senha, erro de validação e acesso de demonstração.
 *
 * @param props - Controlador da tela e preferência de movimento reduzido.
 * @returns Painel do formulário de login.
 */
export function LoginFormPanel({ controller, reduced }: LoginFormPanelProps) {
  const { error, errorTick } = controller
  const emailInvalid = error?.field === 'email'
  const senhaInvalid = error?.field === 'senha'
  const shake = motionClass(reduced, 'login-anim-shake')

  const handleSubmit = (submitEvent: SyntheticEvent) => {
    submitEvent.preventDefault()
    void controller.submitPassword()
  }

  return (
    <div className={cn('flex flex-col gap-4', motionClass(reduced, 'login-anim-swap'))}>
      <div>
        <h2 id="login-title" className="text-2xl font-bold">Entrar</h2>
        <p className="text-muted-foreground mt-1">
          Use a sua conta corporativa da V-Energy. O seu perfil de acesso vem da conta.
        </p>
      </div>

      <Button type="button" size="lg" fullWidth onClick={() => void controller.submitSso()}>
        <ShieldCheck aria-hidden="true" />
        <span>Entrar com SSO corporativo</span>
      </Button>

      <div className="text-muted-foreground flex items-center gap-3 text-xs">
        <Separator className="flex-1" />
        <span>ou com e-mail e senha</span>
        <Separator className="flex-1" />
      </div>

      <form className="flex flex-col gap-4" noValidate onSubmit={handleSubmit}>
        <div key={`email-${errorTick}`} className={cn('flex flex-col gap-1.5', emailInvalid ? shake : '')}>
          <Label htmlFor="login-email">E-mail corporativo</Label>
          <Input
            id="login-email"
            type="email"
            autoComplete="username"
            autoFocus={errorTick === 0 || emailInvalid}
            value={controller.email}
            error={emailInvalid}
            aria-invalid={emailInvalid}
            aria-describedby={emailInvalid ? 'login-error' : undefined}
            onChange={(changeEvent) => controller.setEmail(changeEvent.target.value)}
          />
        </div>

        <div key={`senha-${errorTick}`} className={cn('flex flex-col gap-1.5', senhaInvalid ? shake : '')}>
          <Label htmlFor="login-senha">Senha</Label>
          <Input
            id="login-senha"
            type="password"
            autoComplete="current-password"
            autoFocus={senhaInvalid}
            value={controller.senha}
            error={senhaInvalid}
            aria-invalid={senhaInvalid}
            aria-describedby={senhaInvalid ? 'login-error' : undefined}
            onChange={(changeEvent) => controller.setSenha(changeEvent.target.value)}
          />
        </div>

        {error ? (
          <p
            id="login-error"
            role="alert"
            className={cn('text-destructive text-sm font-semibold', motionClass(reduced, 'login-anim-error'))}
          >
            {error.message}
          </p>
        ) : null}

        <Button type="submit" size="lg" fullWidth>Entrar</Button>
      </form>

      <LoginDemoAccess onSelect={(account) => void controller.enterAsDemo(account)} />
    </div>
  )
}
