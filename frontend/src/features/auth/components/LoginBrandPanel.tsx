import { BrandMark } from '@/components/layout/BrandMark'
import { motionClass } from '@/features/auth/lib/motionClass'
import { cn } from '@/lib/utils'

/** Escala da área piloto, do enunciado do case. */
const PILOT_FACTS = [
  { value: '45 mil', label: 'unidades consumidoras' },
  { value: '14', label: 'municípios' },
  { value: '4 anos', label: 'de histórico' }
]

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
        'border-border bg-sidebar hidden flex-col justify-between gap-6 border-r p-12 lg:flex',
        motionClass(reduced, 'login-anim-fade')
      )}
    >
      <BrandMark />

      <div className="flex max-w-lg flex-col gap-4">
        <h1 className="text-foreground text-3xl font-semibold text-balance">
          Uma fonte única de verdade para a distribuidora.
        </h1>
        <p className="text-muted-foreground text-base text-pretty">
          Cadastro, medição, faturamento, rede e atendimento no mesmo lugar, com um assistente que responde em
          português e mostra de onde veio cada número.
        </p>
      </div>

      <dl className="border-border grid max-w-lg grid-cols-3 gap-6 border-t pt-6">
        {PILOT_FACTS.map((fact) => (
          <div key={fact.label} className="flex flex-col gap-0.5">
            <dt className="text-muted-foreground order-2 text-sm">{fact.label}</dt>
            <dd className="text-foreground order-1 text-2xl font-semibold">{fact.value}</dd>
          </div>
        ))}
      </dl>
    </aside>
  )
}
