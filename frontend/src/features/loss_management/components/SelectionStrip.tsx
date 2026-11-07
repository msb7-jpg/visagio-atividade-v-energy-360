import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { QueueSummary, SuspiciousUnit } from '@/features/loss_management/types/lossTypes'
import { formatCompactCurrency, formatInteger, formatMwhValue } from '@/features/loss_management/utils/lossFormatters'
import { useCanWriteLosses } from '@/features/loss_management/hooks/useCanWriteLosses'
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
  /** Abre o diálogo de geração das ordens das UCs marcadas. */
  onGenerate: () => void
}

function formatEnergyAndValue(kwhPerMonth: number, valuePerYearRs: number): string {
  return `${formatInteger(kwhPerMonth)} kWh/mês · ${formatCompactCurrency(valuePerYearRs)}/ano`
}

/**
 * Barra fixa da seleção: quantas UCs foram marcadas, a energia e o retorno esperado delas, o atalho para limpar e a
 * ação de gerar as ordens (só para quem pode gravar).
 *
 * Os números vêm do resumo do servidor (kWh/mês recuperável e retorno esperado pelo histórico de campo);
 * enquanto ele não chega a faixa mostra só a contagem, nunca um valor estimado no navegador.
 *
 * @param props - UCs marcadas, resumo do servidor, se ele está atualizando, a limpeza e a geração das ordens.
 * @returns Faixa em destaque com selo das UCs fora da faixa prioritária quando há; nada sem UC marcada.
 */
export function SelectionStrip({ units, summary, isUpdating, onClear, onGenerate }: SelectionStripProps) {
  const canWrite = useCanWriteLosses()
  const { selectedCount, otherCount } = selectionOutlook(units)
  if (selectedCount === 0) return null

  return (
    <>
      <section
        aria-label="Resumo da seleção"
        aria-busy={isUpdating}
        className={cn(
          'border-border bg-card fixed inset-x-0 bottom-0 z-40 flex flex-wrap items-center gap-x-6 gap-y-2 border-t px-6 py-3 pr-24 text-sm shadow-lg md:left-72',
          isUpdating ? 'opacity-70' : ''
        )}
      >
        <span className="flex items-baseline gap-1.5">
          <span className="text-foreground text-2xl font-semibold">{formatInteger(selectedCount)}</span>
          <span className="text-muted-foreground">{selectedCount === 1 ? 'unidade selecionada' : 'unidades selecionadas'}</span>
        </span>
        {summary ? (
          <>
            <span aria-hidden="true" className="bg-border h-8 w-px" />
            <span className="flex items-baseline gap-1">
              <span className="text-foreground text-xl font-semibold">{formatMwhValue(summary.kwh_mes_selecionadas)}</span>
              <span className="text-muted-foreground">MWh/mês</span>
            </span>
            <span className="flex items-baseline gap-1">
              <span className="text-foreground text-xl font-semibold">
                {formatCompactCurrency(summary.valor_ano_selecionadas_rs)}
              </span>
              <span className="text-muted-foreground">/ano</span>
            </span>
            <span className="flex flex-wrap items-baseline gap-x-2" title="Estimado pelo histórico de campo">
              <span className="text-muted-foreground">Retorno esperado</span>
              <span className="text-foreground font-semibold">
                {formatEnergyAndValue(summary.retorno_esperado_kwh_mes, summary.retorno_esperado_valor_ano_rs)}
              </span>
            </span>
          </>
        ) : null}
        {otherCount > 0 ? (
          <Badge variant="warning">{formatInteger(otherCount)} fora da faixa prioritária</Badge>
        ) : null}
        <div className="ml-auto flex flex-wrap items-center gap-3">
          <Button type="button" variant="outline" size="sm" onClick={onClear}>
            Limpar seleção
          </Button>
          {canWrite ? (
            <Button type="button" onClick={onGenerate}>
              Gerar ordens de inspeção ({formatInteger(selectedCount)})
            </Button>
          ) : null}
        </div>
      </section>
    </>
  )
}
