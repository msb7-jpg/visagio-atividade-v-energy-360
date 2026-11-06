import { ArrowRight } from 'lucide-react'
import type { ProactiveInsightsData } from '@/features/insights/api/insightsApi'
import { InsightHighlights } from '@/features/insights/components/InsightHighlights'
import { cn } from '@/lib/utils'

/**
 * Conteúdo do resumo da IA: manchete em destaque, frase de apoio, próximo passo e os números ao lado.
 * Sem manchete (resposta no formato antigo), o resumo executivo vira a manchete.
 *
 * @param props - Resposta da API de insights.
 * @returns Grade com o texto à esquerda e os destaques à direita.
 */
export function InsightBody({ data }: { data: ProactiveInsightsData }) {
  const headline = data.manchete || data.resumo_executivo
  const support = data.manchete ? data.resumo_executivo : null
  const highlights = data.destaques ?? []
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
      <div className={cn('flex min-w-0 flex-col gap-2', highlights.length > 0 ? 'lg:col-span-2' : 'lg:col-span-5')}>
        <p className="text-foreground text-xl font-semibold text-balance">{headline}</p>
        {support ? <p className="text-muted-foreground text-sm">{support}</p> : null}
        {data.acao_recomendada ? (
          <p className="text-foreground mt-1 flex items-start gap-2 text-sm font-medium">
            <ArrowRight aria-hidden="true" className="text-primary mt-0.5 size-4 shrink-0" />
            <span>
              <span className="text-primary">Próximo passo:</span> {data.acao_recomendada}
            </span>
          </p>
        ) : null}
      </div>
      <InsightHighlights highlights={highlights} />
    </div>
  )
}
