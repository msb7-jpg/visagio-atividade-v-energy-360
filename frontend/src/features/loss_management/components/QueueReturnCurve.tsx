import { ErrorState } from '@/components/feedback/ErrorState'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ReturnCurveChart } from '@/features/loss_management/components/ReturnCurveChart'
import type { ReturnCurve } from '@/features/loss_management/types/queueCurveTypes'
import { formatCurrency } from '@/features/loss_management/utils/lossFormatters'
import { describeCut, totalExpectedReturn } from '@/features/loss_management/utils/queueCurve'

const COST_INPUT_ID = 'queue-curve-cost'

interface CurveBodyProps {
  curve: ReturnCurve | undefined
  isError: boolean
  /** True enquanto a curva mostrada é a de um custo anterior: o corte dela não vale para o custo digitado. */
  isStale: boolean
  onUseCut: (count: number) => void
  onRetry: () => void
}

function CurveBody({ curve, isError, isStale, onUseCut, onRetry }: CurveBodyProps) {
  if (!curve) {
    return isError ? (
      <ErrorState
        title="Não foi possível carregar a curva de retorno"
        description="A fila continua disponível."
        onRetry={onRetry}
      />
    ) : (
      <p className="text-muted-foreground text-sm">Calculando a curva de retorno…</p>
    )
  }
  if (curve.total_ucs === 0) return <p className="text-muted-foreground text-sm">{describeCut(curve)}</p>
  const cut = curve.corte_sugerido ?? 0
  return (
    <>
      <ReturnCurveChart curve={curve} />
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <div className="flex flex-col gap-1">
          <p>{describeCut(curve)}</p>
          <p className="text-muted-foreground text-xs">
            Retorno esperado das {curve.total_ucs} UCs livres: {formatCurrency(totalExpectedReturn(curve))}/ano.
          </p>
        </div>
        {cut > 0 ? (
          <Button type="button" variant="outline" size="sm" disabled={isStale} onClick={() => onUseCut(cut)}>
            Usar o corte sugerido ({cut})
          </Button>
        ) : null}
      </div>
    </>
  )
}

interface QueueReturnCurveProps extends CurveBodyProps {
  costText: string
  onCostChange: (text: string) => void
}

/**
 * Curva de retorno acumulado da fila: mostra onde cada inspeção a mais rende pouco e, com o custo de uma inspeção,
 * sugere quantas UCs inspecionar. O gerente decide o número; a tela só ajuda a escolhê-lo.
 *
 * @param props - Curva do servidor, custo digitado e os callbacks.
 * @returns Cartão com o campo de custo, o gráfico, o corte sugerido e o botão que o aplica.
 */
export function QueueReturnCurve({ costText, onCostChange, ...bodyProps }: QueueReturnCurveProps) {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-medium">Quantas inspecionar</h2>
          <p className="text-muted-foreground text-xs">
            Retorno esperado somado, da primeira UC livre da fila até cada posição. A curva considera a fila inteira, sem
            os filtros.
          </p>
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor={COST_INPUT_ID}>Custo por inspeção (R$)</Label>
          <div className="w-36">
            <Input
              id={COST_INPUT_ID}
              inputMode="decimal"
              placeholder="ex.: 150"
              value={costText}
              onChange={(event) => onCostChange(event.target.value)}
            />
          </div>
        </div>
      </div>
      <CurveBody {...bodyProps} />
    </Card>
  )
}
