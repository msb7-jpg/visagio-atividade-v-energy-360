import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { QueueSummary, SuspiciousUnit } from '@/features/loss_management/types/lossTypes'
import { formatCompactCurrency, formatInteger, formatPercent } from '@/features/loss_management/utils/lossFormatters'
import { PRIORITY_MIN_HIT_PROBABILITY } from '@/features/loss_management/utils/queueBands'
import { selectionOutlook } from '@/features/loss_management/utils/queueOutlook'
import { cn } from '@/lib/utils'

interface SelectionStripProps {
  /** UCs marcadas para gerar ordem; sem elas a faixa não aparece. */
  units: SuspiciousUnit[]
  /** Resumo do servidor para a seleção atual; nulo enquanto o primeiro resumo não chega. */
  summary: QueueSummary | undefined
  /** True enquanto o resumo da nova seleção carrega e os números ainda são os da seleção anterior. */
  isUpdating: boolean
  onClear: () => void
}

function formatEnergyAndValue(kwhPerMonth: number, valuePerYearRs: number): string {
  return `${formatInteger(kwhPerMonth)} kWh/mês · ${formatCompactCurrency(valuePerYearRs)}/ano`
}

/**
 * Faixa da seleção: quantas UCs foram marcadas, a energia e o retorno esperado delas e o atalho para limpar.
 *
 * Os números vêm do resumo do servidor (kWh/mês recuperável e retorno esperado = kWh × chance de cada UC);
 * enquanto ele não chega a faixa mostra só a contagem, nunca um valor estimado no navegador.
 *
 * @param props - UCs marcadas, resumo do servidor, se ele está atualizando e a limpeza da seleção.
 * @returns Faixa em destaque com selo de baixa chance quando há; nada sem UC marcada.
 */
export function SelectionStrip({ units, summary, isUpdating, onClear }: SelectionStripProps) {
  const { selectedCount, lowChanceCount } = selectionOutlook(units)
  if (selectedCount === 0) return null

  return (
    <section
      aria-label="Resumo da seleção"
      aria-busy={isUpdating}
      className={cn(
        'border-primary/30 bg-primary/10 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border px-4 py-2 text-sm',
        isUpdating ? 'opacity-70' : ''
      )}
    >
      <span className="text-foreground font-semibold">
        {formatInteger(selectedCount)} {selectedCount === 1 ? 'selecionada' : 'selecionadas'}
      </span>
      {summary ? (
        <>
          <span className="text-muted-foreground">
            {formatEnergyAndValue(summary.kwh_mes_selecionadas, summary.valor_ano_selecionadas_rs)}
          </span>
          <span className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-muted-foreground">Retorno esperado</span>
            <span className="text-foreground font-semibold">
              {formatEnergyAndValue(summary.retorno_esperado_kwh_mes, summary.retorno_esperado_valor_ano_rs)}
            </span>
            <span className="text-muted-foreground text-xs">(kWh × chance de cada UC)</span>
          </span>
        </>
      ) : null}
      {lowChanceCount > 0 ? (
        <Badge variant="warning">
          {formatInteger(lowChanceCount)} com chance abaixo de {formatPercent(PRIORITY_MIN_HIT_PROBABILITY)}
        </Badge>
      ) : null}
      <Button type="button" variant="link" size="sm" className="ml-auto" onClick={onClear}>
        Limpar seleção
      </Button>
    </section>
  )
}
