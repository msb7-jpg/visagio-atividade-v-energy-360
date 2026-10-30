import { Zap } from 'lucide-react'
import { motionClass } from '@/features/auth/lib/motionClass'
import { cn } from '@/lib/utils'

/**
 * Painel de marca à esquerda da tela de login (só aparece em telas largas).
 *
 * @param props - Preferência de movimento reduzido.
 * @returns Elemento do painel de marca.
 */
export function LoginBrandPanel({ reduced }: { reduced: boolean }) {
  return (
    <aside
      aria-label="Sobre o Grid 360"
      className={cn(
        'bg-primary/20 relative hidden flex-col justify-between gap-6 overflow-hidden p-12 lg:flex',
        motionClass(reduced, 'login-anim-fade')
      )}
    >
      <svg aria-hidden="true" className="text-primary absolute inset-0 size-full opacity-30">
        <defs>
          <pattern id="login-grid" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M48 0H0V48" fill="none" stroke="currentColor" strokeOpacity="0.35" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#login-grid)" />
      </svg>

      <div className="relative flex items-center gap-3">
        <span className="bg-primary text-primary-foreground flex size-11 items-center justify-center rounded-lg">
          <Zap className="size-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-xl font-bold">V-Energy Grid 360</p>
          <p className="text-muted-foreground text-sm">Plataforma Integrada de Operação, Faturamento e IA</p>
        </div>
      </div>

      <div className="relative flex max-w-xl flex-col gap-3">
        <h1 className="text-3xl font-bold text-balance">Uma fonte única de verdade para a distribuidora.</h1>
        <p className="text-muted-foreground text-lg text-pretty">
          Cadastro, medição, faturamento, rede e atendimento no mesmo lugar, com um assistente que
          responde em português e mostra de onde veio cada número.
        </p>
      </div>
    </aside>
  )
}
