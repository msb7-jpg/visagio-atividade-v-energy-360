import { Table, TableBody, TableCaption, TableCell, TableColumns, TableRow } from '@/components/ui/table'
import type { Backtest } from '@/features/loss_management/types/backtestTypes'
import { formatCompetencia, formatMwh } from '@/features/loss_management/utils/backtestFormat'
import { formatInteger, formatPercent } from '@/features/loss_management/utils/lossFormatters'

const EMPTY_VALUE = '—'
const COLUMNS = [
  'Corte',
  'Precisão da seleção',
  'Acerto previsto',
  'Energia esperada',
  'Energia recuperada',
  'Irregulares na fila',
  'Inspecionadas'
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
      <TableCell>{formatRate(result.chance_media_prevista)}</TableCell>
      <TableCell>{formatMwh(result.kwh_esperado)}</TableCell>
      <TableCell>{formatMwh(result.kwh_recuperado)}</TableCell>
      <TableCell>{`${formatInteger(result.irregulares_na_fila)} de ${formatInteger(result.irregulares_janela)}`}</TableCell>
      <TableCell>{`${formatInteger(result.n_inspecionadas)} de ${formatInteger(result.n_selecionadas)}`}</TableCell>
    </TableRow>
  )
}

/**
 * Backtest de todos os cortes lado a lado: um corte consistente vale mais que um resultado isolado. O que importa é o
 * previsto ao lado do realizado, e não a comparação com o que o campo já obtinha.
 *
 * @param props - Um resultado por corte e o corte aberto em detalhe, que fica destacado.
 * @returns Tabela com precisão, acerto previsto, energia esperada e recuperada, irregulares na fila e n por corte.
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
