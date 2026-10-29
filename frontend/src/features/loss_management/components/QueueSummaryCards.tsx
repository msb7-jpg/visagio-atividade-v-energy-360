import { ErrorState } from '@/components/feedback/ErrorState'
import { LoadingSkeleton } from '@/components/feedback/LoadingSkeleton'
import { CapacityCard } from '@/features/loss_management/components/CapacityCard'
import { HitRateCard } from '@/features/loss_management/components/HitRateCard'
import { SummaryCard } from '@/features/loss_management/components/SummaryCard'
import type { QueueSummary } from '@/features/loss_management/types/lossTypes'
import { formatCompactCurrency, formatInteger, formatTariffNote } from '@/features/loss_management/utils/lossFormatters'
import { cn } from '@/lib/utils'

interface QueueSummaryCardsProps {
  summary: QueueSummary | undefined
  /** True enquanto o resumo da nova seleção carrega e os números ainda são os da seleção anterior. */
  isUpdating: boolean
  /** True quando a consulta do resumo falhou e não há números anteriores para mostrar. */
  isError: boolean
  onRetry: () => void
}

/**
 * Quatro cartões do topo: capacidade, energia das selecionadas, retorno esperado e taxa histórica de acerto.
 *
 * @param props - Resumo da seleção atual, se ele está sendo atualizado, se a consulta falhou e a nova tentativa.
 * @returns Grade de cartões; esqueleto enquanto o primeiro resumo não chega, ou `ErrorState` se ele falhar.
 */
export function QueueSummaryCards({ summary, isUpdating, isError, onRetry }: QueueSummaryCardsProps) {
  if (!summary) {
    return isError ? (
      <ErrorState
        title="Não foi possível carregar o resumo da capacidade e do retorno"
        description="A fila continua disponível."
        onRetry={onRetry}
      />
    ) : (
      <LoadingSkeleton count={4} className="h-24" />
    )
  }

  return (
    <section
      aria-label="Resumo da capacidade e do retorno"
      aria-busy={isUpdating}
      className={cn('grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4', isUpdating ? 'opacity-70' : '')}
    >
      <CapacityCard summary={summary} />
      <SummaryCard title="Energia recuperável das selecionadas">
        <p className="flex items-baseline gap-1.5">
          <span className="text-foreground text-2xl font-bold">{formatInteger(summary.kwh_mes_selecionadas)}</span>
          <span className="text-muted-foreground text-sm">kWh/mês</span>
        </p>
        <p className="text-muted-foreground text-xs">
          {formatCompactCurrency(summary.valor_ano_selecionadas_rs)}/ano
        </p>
        <p className="text-muted-foreground text-xs">
          {formatTariffNote(summary.tarifa_rs_kwh, summary.tarifa_periodo_inicio, summary.tarifa_periodo_fim)}
        </p>
      </SummaryCard>
      <SummaryCard title="Retorno esperado">
        <p className="flex items-baseline gap-1.5">
          <span className="text-foreground text-2xl font-bold">{formatInteger(summary.retorno_esperado_kwh_mes)}</span>
          <span className="text-muted-foreground text-sm">kWh/mês</span>
        </p>
        <p className="text-muted-foreground text-xs">
          {formatCompactCurrency(summary.retorno_esperado_valor_ano_rs)}/ano · soma da energia × chance de acerto de cada UC
        </p>
      </SummaryCard>
      <HitRateCard hitRate={summary.taxa_acerto} />
    </section>
  )
}
