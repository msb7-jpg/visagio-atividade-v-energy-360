import { StatTile } from '@/components/data/StatTile'
import type { Backtest } from '@/features/loss_management/types/backtestTypes'
import { formatMwh, formatPoints, formatWindow } from '@/features/loss_management/utils/backtestFormat'
import { formatInteger, formatPercent } from '@/features/loss_management/utils/lossFormatters'

const EMPTY_VALUE = '—'

interface BacktestCardProps {
  backtest: Backtest
}

/**
 * Resultado do backtest: precisão da seleção contra a linha de base, com a conta nos tooltips.
 *
 * @param props - Resultado devolvido pela API para a data de corte e o tamanho escolhidos.
 * @returns Quatro indicadores e a janela em que o resultado foi medido.
 */
export function BacktestCard({ backtest }: BacktestCardProps) {
  if (!backtest.backtest_executado || backtest.janela_resultado_inicio === null) {
    return (
      <p className="text-muted-foreground text-sm">
        Backtest ainda não executado: não há histórico de inspeções de campo.
      </p>
    )
  }
  const { precisao_selecao: precision, linha_base: baseline } = backtest
  const windowEnd = backtest.janela_resultado_fim ?? backtest.janela_resultado_inicio
  const selected = formatInteger(backtest.n_selecionadas)
  const hits = `${formatInteger(backtest.n_irregulares)} ÷ ${formatInteger(backtest.n_inspecionadas)}`

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Precisão da seleção"
          value={precision === null ? EMPTY_VALUE : formatPercent(precision)}
          hint={`Irregulares ÷ inspecionadas entre as ${selected} UCs selecionadas: ${hits}.`}
          footnote={
            precision === null
              ? 'Sem inspeções suficientes para calcular'
              : `n = ${formatInteger(backtest.n_inspecionadas)} inspecionadas`
          }
        />
        <StatTile
          label="Linha de base da operação"
          value={baseline === null ? EMPTY_VALUE : formatPercent(baseline)}
          hint={`Taxa de acerto de todas as ${formatInteger(backtest.inspecoes_janela)} inspeções feitas na mesma janela, selecionadas ou não.`}
        />
        <StatTile
          label="Diferença"
          value={formatPoints(backtest.diferenca_pp)}
          hint="Precisão da seleção menos a linha de base, em pontos percentuais."
        />
        <StatTile
          label="Energia recuperada"
          value={formatMwh(backtest.kwh_recuperado)}
          hint="Soma do kWh recuperado nas inspeções das UCs selecionadas."
        />
      </div>
      <p className="text-muted-foreground text-xs">
        Fila como estava no corte, sem informação posterior. Resultado medido de{' '}
        {formatWindow(backtest.janela_resultado_inicio, windowEnd)}.
      </p>
    </div>
  )
}
