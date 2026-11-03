import { ErrorState } from '@/components/feedback/ErrorState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip-card'
import type { QueueSummary } from '@/features/loss_management/types/lossTypes'
import { formatTariffNote } from '@/features/loss_management/utils/lossFormatters'
import { formatRecoveryNote } from '@/features/loss_management/utils/recoveryEstimate'

interface QueueReferencePillsProps {
  /** Resumo do servidor; nulo enquanto o primeiro resumo não chega. */
  summary: QueueSummary | undefined
  /** True quando a consulta do resumo falhou e não há números anteriores para mostrar. */
  isError: boolean
  onRetry: () => void
}

/**
 * Pílulas de referência sob o título: a tarifa média usada para converter kWh em reais e a nota de como o valor
 * é estimado. Os números da seleção ficam na `SelectionStrip`.
 *
 * @param props - Resumo do servidor, se a consulta falhou e a nova tentativa.
 * @returns Pílula da tarifa com o "como calculamos"; `ErrorState` se o resumo falhar; nada enquanto ele carrega.
 */
export function QueueReferencePills({ summary, isError, onRetry }: QueueReferencePillsProps) {
  if (!summary) {
    return isError ? (
      <ErrorState
        title="Não foi possível carregar o resumo da energia e do retorno"
        description="A fila continua disponível."
        onRetry={onRetry}
      />
    ) : null
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="outline">
        {formatTariffNote(summary.tarifa_rs_kwh, summary.tarifa_periodo_inicio, summary.tarifa_periodo_fim)}
      </Badge>
      <Tooltip content={formatRecoveryNote()}>
        <Button type="button" variant="link" size="sm">como calculamos</Button>
      </Tooltip>
    </div>
  )
}
