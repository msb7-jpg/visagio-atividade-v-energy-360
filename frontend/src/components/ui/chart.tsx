import type { ReactElement, ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { ResponsiveContainer } from 'recharts'
import { cn } from '@/lib/utils'

interface ChartContainerProps {
  children: ReactElement
  className?: string
  label: string
}

/**
 * Container responsivo para gráficos Recharts, no padrão do chart do shadcn/ui.
 * As cores das séries usam os tokens `--color-chart-*` do design system.
 *
 * @param props - Gráfico Recharts, rótulo acessível e classes de layout.
 * @returns Gráfico ocupando a largura disponível com altura padrão.
 */
function ChartContainer({ children, className, label }: ChartContainerProps) {
  return (
    <div role="img" aria-label={label} className={cn('h-72 w-full text-xs', className)}>
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  )
}

interface ChartTooltipFrameProps {
  title: string
  children: ReactNode
}

/**
 * Moldura padronizada do tooltip de gráficos (superfície de card, borda sutil e raio de 12px).
 *
 * @param props - Título do ponto em foco e linhas de detalhe.
 * @returns Caixa do tooltip.
 */
function ChartTooltipFrame({ title, children }: ChartTooltipFrameProps) {
  return (
    <div className="border-border bg-card text-card-foreground flex min-w-44 flex-col gap-1.5 rounded-lg border p-3 shadow-xl">
      <span className="text-foreground text-xs font-semibold">{title}</span>
      {children}
    </div>
  )
}

const legendSwatchVariants = cva('size-2.5 rounded-sm', {
  variants: {
    series: {
      'chart-1': 'bg-chart-1',
      'chart-2': 'bg-chart-2',
      'chart-3': 'bg-chart-3',
      'chart-4': 'bg-chart-4',
      'chart-5': 'bg-chart-5'
    }
  },
  defaultVariants: {
    series: 'chart-1'
  }
})

interface ChartLegendItemProps extends VariantProps<typeof legendSwatchVariants> {
  label: string
}

/**
 * Item de legenda com amostra de cor da série.
 *
 * @param props - Nome da série e token de cor `--color-chart-*` usado por ela.
 * @returns Amostra colorida seguida do nome da série.
 */
function ChartLegendItem({ label, series }: ChartLegendItemProps) {
  return (
    <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
      <span className={legendSwatchVariants({ series })} />
      {label}
    </span>
  )
}

export { ChartContainer, ChartLegendItem, ChartTooltipFrame }
