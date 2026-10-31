import { ErrorState } from '@/components/feedback/ErrorState'
import { LoadingSkeleton } from '@/components/feedback/LoadingSkeleton'
import { SummaryCard } from '@/features/loss_management/components/SummaryCard'
import type { QueueSummary } from '@/features/loss_management/types/lossTypes'
import { formatCompactCurrency, formatInteger, formatTariffNote } from '@/features/loss_management/utils/lossFormatters'
import { formatRecoveryNote } from '@/features/loss_management/utils/recoveryEstimate'
import { cn } from '@/lib/utils'

const EXPECTED_RETURN_EXPLANATION = 'Soma da energia × chance de acerto de cada UC selecionada.'

interface QueueSummaryCardsProps {
  summary: QueueSummary | undefined
  /** True enquanto o resumo da nova seleção carrega e os números ainda são os da seleção anterior. */
  isUpdating: boolean
  /** True quando a consulta do resumo falhou e não há números anteriores para mostrar. */
  isError: boolean
  onRetry: () => void
}

interface MetricLineProps {
  kwhPerMonth: number
  valuePerYearRs: number
}

/** Número principal em kWh/mês e, ao lado, o valor anual em reais. */
function MetricLine({ kwhPerMonth, valuePerYearRs }: MetricLineProps) {
  return (
    <p className="flex flex-wrap items-baseline gap-x-1.5">
      <span className="text-foreground text-xl font-bold">{formatInteger(kwhPerMonth)}</span>
      <span className="text-muted-foreground text-sm">kWh/mês</span>
      <span className="text-muted-foreground text-sm">·</span>
      <span className="text-muted-foreground text-sm">{formatCompactCurrency(valuePerYearRs)}/ano</span>
    </p>
  )
}

/**
 * Dois cartões do topo: energia recuperável das selecionadas (com a tarifa usada) e retorno esperado.
 *
 * @param props - Resumo da seleção atual, se ele está sendo atualizado, se a consulta falhou e a nova tentativa.
 * @returns Grade de cartões; esqueleto enquanto o primeiro resumo não chega, ou `ErrorState` se ele falhar.
 */
export function QueueSummaryCards({ summary, isUpdating, isError, onRetry }: QueueSummaryCardsProps) {
  if (!summary) {
    return isError ? (
      <ErrorState
        title="Não foi possível carregar o resumo da energia e do retorno"
        description="A fila continua disponível."
        onRetry={onRetry}
      />
    ) : (
      <LoadingSkeleton count={2} className="h-24" />
    )
  }

  return (
    <section
      aria-label="Resumo da energia e do retorno"
      aria-busy={isUpdating}
      className={cn('grid grid-cols-1 gap-3 sm:grid-cols-2', isUpdating ? 'opacity-70' : '')}
    >
      <SummaryCard title="Energia recuperável das selecionadas" hint={formatRecoveryNote()}>
        <MetricLine kwhPerMonth={summary.kwh_mes_selecionadas} valuePerYearRs={summary.valor_ano_selecionadas_rs} />
        <p className="text-muted-foreground text-xs">
          {formatTariffNote(summary.tarifa_rs_kwh, summary.tarifa_periodo_inicio, summary.tarifa_periodo_fim)}
        </p>
      </SummaryCard>
      <SummaryCard title="Retorno esperado" hint={EXPECTED_RETURN_EXPLANATION}>
        <MetricLine kwhPerMonth={summary.retorno_esperado_kwh_mes} valuePerYearRs={summary.retorno_esperado_valor_ano_rs} />
      </SummaryCard>
    </section>
  )
}
