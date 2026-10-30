import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { LoginProfile } from '@/features/auth/lib/loginProfile'
import { motionClass } from '@/features/auth/lib/motionClass'
import { cn } from '@/lib/utils'

interface LoginSuccessPanelProps {
  profile: LoginProfile
  reduced: boolean
  onSwitchAccount: () => void
}

/**
 * Estado "logado": saudação, cargo da conta e atalho para a tela inicial do cargo.
 *
 * @param props - Perfil resolvido, preferência de movimento reduzido e ação de trocar de conta.
 * @returns Painel de boas-vindas.
 */
export function LoginSuccessPanel({ profile, reduced, onSwitchAccount }: LoginSuccessPanelProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className={cn(
            'bg-primary text-primary-foreground flex size-12 shrink-0 items-center justify-center rounded-full text-lg font-bold',
            motionClass(reduced, 'login-anim-avatar')
          )}
        >
          {profile.initials}
        </span>
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold">Olá, {profile.firstName}</h2>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="success">Sessão iniciada</Badge>
            <span className="text-muted-foreground text-xs">Perfil {profile.roleLabel}</span>
          </div>
        </div>
      </div>

      <div className={motionClass(reduced, 'login-anim-cta')}>
        <Button asChild size="lg" fullWidth>
          <Link to={profile.homePath}>
            <span>Ir para {profile.homeLabel}</span>
            <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      </div>

      <p className="text-muted-foreground text-xs">
        Você vê as telas liberadas para o perfil {profile.roleLabel}. Para outro acesso, peça ao seu gestor
        a mudança de cargo na conta.
      </p>
      <Button type="button" variant="link" className="self-start" onClick={onSwitchAccount}>Usar outra conta</Button>
    </div>
  )
}
