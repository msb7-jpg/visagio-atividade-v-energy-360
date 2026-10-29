import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip } from '@/components/ui/tooltip-card'
import type { IndicatorGroup } from '@/features/executive_dashboard/types/executiveDashboardTypes'
import { formatIndicatorChange, formatIndicatorValue } from '@/features/executive_dashboard/utils/indicatorFormatters'
import { EVALUATIONS, variationArrow } from '@/features/executive_dashboard/utils/indicatorTrend'
import { cn } from '@/lib/utils'
import {
  AlertTriangle,
  HelpCircle
} from 'lucide-react'

interface IndicatorsTableProps {
  groups: IndicatorGroup[]
}

/**
 * Tabela executiva consolidada de comparação de indicadores temporais.
 * A seta segue o sentido do número; a cor e o selo dizem se melhorou ou piorou.
 *
 * @param props - Grupos de indicadores devolvidos pela API.
 * @returns Tabela com todas as métricas alinhadas em colunas executivas.
 */
export function IndicatorsTable({ groups }: IndicatorsTableProps) {
  return (
    <div className="glass-panel overflow-hidden rounded-lg shadow-xl">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-1/4">Indicador</TableHead>
            <TableHead className="w-28">Área</TableHead>
            <TableHead className="w-36 text-right whitespace-nowrap">Período Base</TableHead>
            <TableHead className="w-36 text-right whitespace-nowrap">Período Atual</TableHead>
            <TableHead className="w-32 text-right whitespace-nowrap">Variação</TableHead>
            <TableHead className="min-w-48">Detalhamento & Avisos</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {groups.flatMap((group) => {
            return group.indicadores.map((indicator, index) => {
              const evaluation = EVALUATIONS[indicator.avaliacao]
              const arrow = variationArrow(indicator)
              return (
                <TableRow
                  key={indicator.id}
                  data-testid={`indicator-${indicator.id}`}
                >
                  <TableCell>
                    <Tooltip content={indicator.explicacao}>
                      <span className="cursor-help text-foreground hover:text-primary transition-colors flex items-center gap-1.5 font-medium">
                        {indicator.titulo}
                        <HelpCircle className="size-3 text-muted-foreground/60" aria-hidden="true" />
                      </span>
                    </Tooltip>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {index === 0 ? <h2 className="sr-only">{group.titulo}</h2> : null}
                      <Badge variant="secondary">
                        {group.titulo}
                      </Badge>
                    </div>
                  </TableCell>

                  <TableCell className="text-right whitespace-nowrap">
                    <span className="font-mono tabular-nums text-muted-foreground text-xs">
                      <span className="sr-only">Antes: </span>
                      {formatIndicatorValue(indicator.base, indicator.unidade)}
                    </span>
                  </TableCell>

                  <TableCell className="text-right whitespace-nowrap">
                    <span className="font-mono tabular-nums font-bold text-foreground">
                      {formatIndicatorValue(indicator.atual, indicator.unidade)}
                    </span>
                  </TableCell>

                  <TableCell className="text-right whitespace-nowrap">
                    <div className="flex flex-col items-end gap-1">
                      <span className={cn('font-mono tabular-nums font-semibold text-xs', evaluation.textColor)}>
                        {arrow ? <span aria-hidden="true">{arrow}</span> : null}
                        <span title={indicator.variacao_pp !== null ? 'Pontos percentuais' : undefined}>
                          {formatIndicatorChange(indicator.variacao_pct, indicator.variacao_pp)}
                        </span>
                      </span>
                      <Badge variant={evaluation.tone}>{evaluation.label}</Badge>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-wrap items-center gap-2">
                      {indicator.aviso ? (
                        <Tooltip content={indicator.aviso}>
                          <span className="inline-flex items-center gap-1 rounded bg-warning/15 px-2 py-0.5 text-xs text-warning border border-warning/30 hover:bg-warning/25 transition-colors cursor-help shrink-0">
                            <AlertTriangle className="size-3" aria-hidden="true" />
                            <span>Aviso climático</span>
                            <span className="sr-only">{indicator.aviso}</span>
                          </span>
                        </Tooltip>
                      ) : null}
                      {indicator.detalhe ? (
                        <span className="text-xs text-muted-foreground truncate max-w-xs">
                          {indicator.detalhe.titulo}: {formatIndicatorValue(indicator.detalhe.atual, indicator.detalhe.unidade)}{' '}
                          (antes {formatIndicatorValue(indicator.detalhe.base, indicator.detalhe.unidade)})
                        </span>
                      ) : null}
                      {!indicator.aviso && !indicator.detalhe ? (
                        <span className="text-xs text-muted-foreground/40">—</span>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })
          })}
        </TableBody>
      </Table>
    </div>
  )
}
