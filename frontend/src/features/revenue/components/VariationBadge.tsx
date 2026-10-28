import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatVariation } from '@/features/revenue/utils/revenueFormatters'

function trendFor(variation: number | null) {
  if (variation === null || variation === 0) {
    return { variant: 'outline', icon: <Minus className="size-3" /> } as const
  }
  return variation < 0
    ? ({ variant: 'destructive', icon: <ArrowDownRight className="size-3" /> } as const)
    : ({ variant: 'secondary', icon: <ArrowUpRight className="size-3" /> } as const)
}

/**
 * Selo com a variação percentual contra a janela base e a seta da tendência.
 *
 * @param props - Variação percentual (já multiplicada por 100) ou `null` sem base comparável.
 * @returns Badge acessível com ícone e valor.
 */
export function VariationBadge({ variation }: { variation: number | null }) {
  const { variant, icon } = trendFor(variation)
  return (
    <Badge variant={variant} aria-label={`Variação de ${formatVariation(variation)} em relação à janela base`}>
      <span className="flex items-center gap-1">
        {icon}
        {formatVariation(variation)}
      </span>
    </Badge>
  )
}
