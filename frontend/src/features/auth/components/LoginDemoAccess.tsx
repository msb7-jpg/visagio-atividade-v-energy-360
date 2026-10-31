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
      className="border-input flex flex-col gap-2 rounded-lg border border-dashed p-4"
    >
      <div className="flex items-center justify-between gap-2">
        <h3 id="login-demo-title" className="text-sm font-semibold">Acesso de demonstração</h3>
        <Badge variant="warning">Modo demo</Badge>
      </div>
      <p className="text-muted-foreground text-xs">
        Só para a apresentação: entra sem digitar a senha, com uma conta de exemplo.
      </p>
      <div className="flex flex-col gap-1.5">
        {DEMO_ACCOUNTS.map((account) => (
          <Button
            key={account.email}
            type="button"
            variant="outline"
            fullWidth
            className="justify-start"
            onClick={() => onSelect(account)}
          >
            <span className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-full text-xs font-bold">
              {initialsOf(account.nome)}
            </span>
            <span>{account.nome}</span>
            <span className="text-muted-foreground text-xs">{roleLabel(account.role)}</span>
          </Button>
        ))}
      </div>
    </section>
  )
}
