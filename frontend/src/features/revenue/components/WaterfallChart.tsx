import type { CSSProperties } from 'react'
import { MotionConfig, motion } from 'motion/react'
import { Tooltip } from '@/components/ui/tooltip-card'
import { cn } from '@/lib/utils'
import { formatCompactCurrency, formatSignedCompactCurrency } from '@/features/revenue/utils/revenueFormatters'
import type { WaterfallAxis, WaterfallBar, WaterfallKind } from '@/features/revenue/utils/revenueWaterfall'

const BAR_STYLES: Record<WaterfallKind, string> = {
  total: 'bg-primary',
  increase: 'bg-chart-2',
  decrease: 'bg-destructive'
}
const GRID_STEPS = [0, 1 / 3, 2 / 3, 1]

function formatBarValue(bar: WaterfallBar): string {
  return bar.kind === 'total' ? formatCompactCurrency(bar.value) : formatSignedCompactCurrency(bar.value)
}

function BarTooltip({ bar }: { bar: WaterfallBar }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-foreground text-xs font-semibold">{bar.label}: {formatBarValue(bar)}</span>
      <span className="text-muted-foreground text-xs leading-relaxed">{bar.explanation}</span>
    </div>
  )
}

function WaterfallColumn({ bar }: { bar: WaterfallBar }) {
  return (
    <Tooltip content={<BarTooltip bar={bar} />} containerClassName="flex h-full flex-1 items-end">
      <div className="relative h-full w-full">
        <motion.div
          className={cn('absolute inset-x-2 bottom-(--plot-bottom) rounded-sm sm:inset-x-4', BAR_STYLES[bar.kind])}
          style={{ '--plot-bottom': `${bar.bottomPct}%` } as CSSProperties}
          initial={{ height: 0 }}
          animate={{ height: `${bar.heightPct}%` }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
        />
      </div>
    </Tooltip>
  )
}

/**
 * Ponte de receita (waterfall): receita base, quatro efeitos e receita atual, construída com o design system.
 * O eixo não começa em zero; os valores exatos aparecem no tooltip e na tabela equivalente para leitores de tela.
 *
 * @param props - Eixo e colunas calculados por `buildWaterfallAxis`.
 * @returns Gráfico de colunas com rótulos, linhas de grade e tooltip por coluna.
 */
export function WaterfallChart({ axis }: { axis: WaterfallAxis }) {
  const span = axis.max - axis.min
  return (
    <MotionConfig reducedMotion="user">
      <div className="overflow-x-auto py-3">
        <div className="flex min-w-xl flex-col gap-2">
          <div role="img" aria-label="Ponte de receita entre a janela base e a janela atual" className="flex gap-2">
            <div className="text-muted-foreground relative h-64 w-20 shrink-0 text-xs">
              {GRID_STEPS.map((step) => (
                <span key={step} className="absolute right-0 bottom-(--plot-bottom) translate-y-1/2" style={{ '--plot-bottom': `${step * 100}%` } as CSSProperties}>
                  {formatCompactCurrency(axis.min + span * step)}
                </span>
              ))}
            </div>
            <div className="relative h-64 flex-1">
              {GRID_STEPS.map((step) => (
                <div key={step} className="border-border absolute inset-x-0 bottom-(--plot-bottom) border-t" style={{ '--plot-bottom': `${step * 100}%` } as CSSProperties} />
              ))}
              <div className="relative flex h-full">
                {axis.bars.map((bar) => (
                  <WaterfallColumn key={bar.key} bar={bar} />
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="w-20 shrink-0" />
            <div className="flex flex-1">
              {axis.bars.map((bar) => (
                <div key={bar.key} className="flex flex-1 flex-col items-center gap-0.5 text-center">
                  <span className="text-foreground text-xs font-semibold">{formatBarValue(bar)}</span>
                  <span className="text-muted-foreground text-xs">{bar.label}</span>
                </div>
              ))}
            </div>
          </div>
          <table className="sr-only">
            <caption>Ponte de receita entre as janelas</caption>
            <tbody>
              {axis.bars.map((bar) => (
                <tr key={bar.key}>
                  <th scope="row">{bar.label}</th>
                  <td>{formatBarValue(bar)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </MotionConfig>
  )
}
