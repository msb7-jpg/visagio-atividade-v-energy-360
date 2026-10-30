import { Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motionClass } from '@/features/auth/lib/motionClass'
import { cn } from '@/lib/utils'

interface LoginNoProfilePanelProps {
  email: string
  reduced: boolean
  onBack: () => void
}

/**
 * Estado "sem perfil": conta autenticada, mas com cargo que não libera nenhuma tela do portal.
 *
 * @param props - E-mail da conta, preferência de movimento reduzido e ação de voltar.
 * @returns Painel com aviso (`role="alert"`).
 */
export function LoginNoProfilePanel({ email, reduced, onBack }: LoginNoProfilePanelProps) {
  return (
    <div className="flex flex-col gap-4">
      <div
        role="alert"
        className={cn(
          'border-border bg-card flex flex-col gap-2.5 rounded-lg border p-4',
          motionClass(reduced, 'login-anim-swap')
        )}
      >
        <Lock className="text-muted-foreground size-7" aria-hidden="true" />
        <h2 className="text-xl font-bold">Sua conta não tem perfil no Grid 360</h2>
        <p className="text-muted-foreground">
          <span className="tabular-nums">{email}</span> foi autenticado, mas o cargo dessa conta não libera
          nenhuma tela do portal. Peça a inclusão ao seu gestor.
        </p>
      </div>
      <Button type="button" variant="link" className="self-start" onClick={onBack}>Voltar</Button>
    </div>
  )
}
