import type { ReactNode } from 'react'
import { Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { InsightTone } from '@/features/insights/api/insightsApi'

const TONES: Record<InsightTone, { label: string; variant: 'success' | 'accent' | 'warning' | 'destructive' }> = {
  positivo: { label: 'Positivo', variant: 'success' },
  neutro: { label: 'Estável', variant: 'accent' },
  atencao: { label: 'Atenção', variant: 'warning' },
  critico: { label: 'Crítico', variant: 'destructive' }
}

interface InsightShellProps {
  tone?: InsightTone
  actions?: ReactNode
  children: ReactNode
}

/**
 * Moldura do resumo da IA: fundo na cor da marca, selo "Resumo da IA", o tom da leitura e as ações no topo.
 *
 * @param props - Tom da leitura (opcional), botões do topo e conteúdo.
 * @returns Região acessível "Resumo da IA".
 */
export function InsightShell({ tone, actions, children }: InsightShellProps) {
  const toneConfig = tone ? TONES[tone] : null
  return (
    <section role="region" aria-label="Resumo da IA" className="border-primary/20 bg-accent flex flex-col gap-4 rounded-md border p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-sm" aria-hidden="true">
            <Sparkles className="size-3.5" />
          </span>
          <span className="text-primary text-xs font-semibold tracking-wide uppercase">Resumo da IA</span>
          {toneConfig ? <Badge variant={toneConfig.variant}>{toneConfig.label}</Badge> : null}
        </div>
        {actions ? <div className="flex items-center gap-1">{actions}</div> : null}
      </div>
      {children}
    </section>
  )
}
