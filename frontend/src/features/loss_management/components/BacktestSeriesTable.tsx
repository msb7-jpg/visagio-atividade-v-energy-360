import { Table, TableBody, TableCaption, TableCell, TableColumns, TableRow } from '@/components/ui/table'
import type { Backtest } from '@/features/loss_management/types/backtestTypes'
import { formatCompetencia, formatMwh, formatPoints } from '@/features/loss_management/utils/backtestFormat'
import { formatInteger, formatPercent } from '@/features/loss_management/utils/lossFormatters'

const EMPTY_VALUE = '—'
const COLUMNS = [
  'Corte',
  'Precisão da seleção',
  'Linha de base',
  'Diferença',
  'Inspecionadas',
  'Energia recuperada'
] as const

interface BacktestSeriesTableProps {
  results: Backtest[]
  selectedCutoff: string | null
}

function formatRate(rate: number | null): string {
  return rate === null ? EMPTY_VALUE : formatPercent(rate)
}

interface CutoffRowProps {
  result: Backtest
  isSelected: boolean
}

function CutoffRow({ result, isSelected }: CutoffRowProps) {
  return (
    <TableRow data-state={isSelected ? 'selected' : undefined} aria-current={isSelected ? 'true' : undefined}>
      <TableCell>{result.data_corte ? formatCompetencia(result.data_corte) : EMPTY_VALUE}</TableCell>
      <TableCell>{formatRate(result.precisao_selecao)}</TableCell>
      <TableCell>{formatRate(result.linha_base)}</TableCell>
      <TableCell>{formatPoints(result.diferenca_pp)}</TableCell>
      <TableCell>{`${formatInteger(result.n_inspecionadas)} de ${formatInteger(result.n_selecionadas)}`}</TableCell>
      <TableCell>{formatMwh(result.kwh_recuperado)}</TableCell>
    </TableRow>
  )
}

/**
 * Backtest de todos os cortes lado a lado: um corte consistente vale mais que um resultado isolado.
 *
 * @param props - Um resultado por corte e o corte aberto em detalhe, que fica destacado.
 * @returns Tabela com precisão, linha de base, diferença, n de inspecionadas e energia recuperada por corte.
 */
export function BacktestSeriesTable({ results, selectedCutoff }: BacktestSeriesTableProps) {
  return (
    <Table>
      <TableCaption className="sr-only">Backtest da seleção, um corte por linha</TableCaption>
      <TableColumns columns={COLUMNS} />
      <TableBody>
        {results.map((result) => (
          <CutoffRow
            key={result.data_corte ?? EMPTY_VALUE}
            result={result}
            isSelected={selectedCutoff !== null && result.data_corte === selectedCutoff}
          />
        ))}
      </TableBody>
    </Table>
  )
}
