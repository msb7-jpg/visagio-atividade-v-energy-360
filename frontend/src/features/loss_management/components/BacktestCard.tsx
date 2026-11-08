import { StatTile } from '@/components/data/StatTile'
import type { Backtest } from '@/features/loss_management/types/backtestTypes'
import { formatMultiple, formatMwh, formatWindow } from '@/features/loss_management/utils/backtestFormat'
import { formatInteger, formatPercent } from '@/features/loss_management/utils/lossFormatters'

const EMPTY_VALUE = '—'

interface BacktestCardProps {
  backtest: Backtest
}

function formatRate(rate: number | null): string {
  return rate === null ? EMPTY_VALUE : formatPercent(rate)
}

/**
 * Resultado do backtest de um corte: o que o modelo previu ao lado do que o campo achou e recuperou.
 *
 * @param props - Resultado devolvido pela API para a data de corte e o tamanho escolhidos.
 * @returns Quatro indicadores (precisão, acerto previsto, energia e cobertura da fila) e a janela medida.
 */
export function BacktestCard({ backtest }: BacktestCardProps) {
  if (!backtest.backtest_executado || backtest.janela_resultado_inicio === null) {
    return (
      <p className="text-muted-foreground text-sm">
        Backtest ainda não executado: não há histórico de inspeções de campo.
      </p>
    )
  }
  const windowEnd = backtest.janela_resultado_fim ?? backtest.janela_resultado_inicio
  const selected = formatInteger(backtest.n_selecionadas)
  const hits = `${formatInteger(backtest.n_irregulares)} ÷ ${formatInteger(backtest.n_inspecionadas)}`
  const recoveredVsExpected =
    backtest.kwh_esperado > 0 ? ` (${formatMultiple(backtest.kwh_recuperado / backtest.kwh_esperado)} o esperado)` : ''
  const queueCoverage =
    backtest.irregulares_janela > 0
      ? formatPercent(backtest.irregulares_na_fila / backtest.irregulares_janela)
      : EMPTY_VALUE

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Precisão da seleção"
          value={formatRate(backtest.precisao_selecao)}
          hint={`Irregulares ÷ inspecionadas entre as ${selected} UCs selecionadas: ${hits}.`}
          footnote={
            backtest.precisao_selecao === null
              ? 'Sem inspeções suficientes para calcular'
              : `n = ${formatInteger(backtest.n_inspecionadas)} inspecionadas`
          }
        />
        <StatTile
          label="Acerto previsto"
          value={formatRate(backtest.chance_media_prevista)}
          hint="Chance de acerto média que o modelo deu às UCs selecionadas que foram inspecionadas. Se andar junto da precisão, a chance prevista está calibrada."
        />
        <StatTile
          label="Energia recuperada"
          value={formatMwh(backtest.kwh_recuperado)}
          hint="Soma do kWh recuperado nas inspeções das UCs selecionadas. O esperado é a energia a recuperar vezes a chance de acerto, só das inspecionadas."
          footnote={`Esperado: ${formatMwh(backtest.kwh_esperado)}${recoveredVsExpected}`}
        />
        <StatTile
          label="Irregulares na fila"
          value={queueCoverage}
          hint={`Das ${formatInteger(backtest.irregulares_janela)} UCs com irregularidade confirmada pelo campo na janela, ${formatInteger(backtest.irregulares_na_fila)} estavam na fila inteira do corte, e não só entre as ${selected} primeiras.`}
        />
      </div>
      <p className="text-muted-foreground text-xs">
        Fila como estava no corte, sem informação posterior. Resultado medido de{' '}
        {formatWindow(backtest.janela_resultado_inicio, windowEnd)}.
      </p>
    </div>
  )
}
