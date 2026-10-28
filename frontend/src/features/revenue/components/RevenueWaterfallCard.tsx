import { Scale } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AsyncState } from '@/components/feedback/AsyncState'
import { getRevenueErrorMessage } from '@/features/revenue/utils/revenueErrorMessage'
import { WaterfallChart } from '@/features/revenue/components/WaterfallChart'
import type { PriceVolumeDecomposition } from '@/features/revenue/types/revenueTypes'
import { formatCompactCurrency } from '@/features/revenue/utils/revenueFormatters'
import { buildInsight, buildWaterfallAxis, buildWaterfallSteps } from '@/features/revenue/utils/revenueWaterfall'

interface RevenueWaterfallCardProps {
  decomposition: PriceVolumeDecomposition | undefined
  isLoading: boolean
  isError: boolean
  error: unknown
}

/**
 * Card da ponte Preço-Volume-Mix: uma frase de leitura, o gráfico e o aviso sobre o eixo.
 *
 * @param props - Resultado da consulta de decomposição.
 * @returns Card com estados de carregamento, erro ou o gráfico.
 */
export function RevenueWaterfallCard({ decomposition, isLoading, isError, error }: RevenueWaterfallCardProps) {
  const axis = decomposition ? buildWaterfallAxis(buildWaterfallSteps(decomposition)) : null
  return (
    <Card variant="glass">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <CardTitle>Da receita base à receita atual</CardTitle>
          <CardDescription>
            {decomposition ? buildInsight(decomposition) : 'Quanto da variação veio de preço, de volume e de mix.'}
          </CardDescription>
        </div>
        <div className="bg-primary/10 text-primary rounded-lg p-1.5">
          <Scale className="size-4" />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <AsyncState
          isLoading={isLoading}
          isError={isError}
          errorTitle="Não foi possível carregar a decomposição"
          errorDescription={getRevenueErrorMessage(error)}
          skeletonCount={3}
        >
          {axis ? (
            <>
              <WaterfallChart axis={axis} />
              <p className="text-muted-foreground text-xs">
                O eixo vertical começa em {formatCompactCurrency(axis.min)}, não em zero, para os efeitos ficarem
                visíveis. A soma dos quatro efeitos é exatamente a variação de receita.
              </p>
            </>
          ) : null}
        </AsyncState>
      </CardContent>
    </Card>
  )
}
