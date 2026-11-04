import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DEMO_ACCOUNTS, isDemoLoginEnabled, type DemoAccount } from '@/features/auth/lib/loginConfig'
import { initialsOf, roleLabel } from '@/features/auth/lib/loginProfile'

/**
 * Bloco "Acesso de demonstração": aparece por padrão (some com `VITE_DEMO_LOGIN=false`). Entra com as contas de exemplo do backend.
 *
 * @param props - Ação que autentica a conta escolhida.
 * @returns Bloco de demonstração, ou nada se o modo demo estiver desligado.
 */
export function LoginDemoAccess({ onSelect }: { onSelect: (account: DemoAccount) => void }) {
  if (!isDemoLoginEnabled()) return null

  return (
    <section
      aria-labelledby="login-demo-title"
      className="border-border flex flex-col gap-3 border-t pt-5"
    >
      <div className="flex items-center justify-between gap-2">
        <h3 id="login-demo-title" className="text-sm font-medium">Acesso de demonstração</h3>
        <Badge variant="muted">Sem senha</Badge>
      </div>
      <p className="text-muted-foreground text-sm">Entra com uma conta de exemplo de cada cargo.</p>
      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {DEMO_ACCOUNTS.map((account) => (
          <Button
            key={account.email}
            type="button"
            variant="outline"
            size="touch"
            fullWidth
            className="justify-start"
            onClick={() => onSelect(account)}
          >
            <span className="bg-secondary text-foreground flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
              {initialsOf(account.nome)}
            </span>
            <span className="flex min-w-0 flex-col items-start leading-tight">
              <span className="truncate">{account.nome}</span>
              <span className="text-muted-foreground truncate text-xs font-normal">{roleLabel(account.role)}</span>
            </span>
          </Button>
        ))}
      </div>
    </section>
  )
}
