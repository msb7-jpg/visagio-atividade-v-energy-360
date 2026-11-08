import { Table, TableBody, TableCaption, TableCell, TableColumns, TableRow } from '@/components/ui/table'
import type { BacktestAtSize } from '@/features/loss_management/types/backtestTypes'
import { formatMwh } from '@/features/loss_management/utils/backtestFormat'
import { formatInteger, formatPercent } from '@/features/loss_management/utils/lossFormatters'

const EMPTY_VALUE = '—'
const COLUMNS = ['Tamanho', 'Inspecionadas', 'Precisão', 'Irregulares capturadas', 'Energia recuperada'] as const

interface SizeRowProps {
  entry: BacktestAtSize
  isSelected: boolean
}

function SizeRow({ entry, isSelected }: SizeRowProps) {
  const { result } = entry
  return (
    <TableRow data-state={isSelected ? 'selected' : undefined} aria-current={isSelected ? 'true' : undefined}>
      <TableCell>{`Top ${formatInteger(entry.tamanho)}`}</TableCell>
      <TableCell>{`${formatInteger(result.n_inspecionadas)} de ${formatInteger(result.n_selecionadas)}`}</TableCell>
      <TableCell>{result.precisao_selecao === null ? EMPTY_VALUE : formatPercent(result.precisao_selecao)}</TableCell>
      <TableCell>{`${formatInteger(result.n_irregulares)} de ${formatInteger(result.irregulares_janela)}`}</TableCell>
      <TableCell>{formatMwh(result.kwh_recuperado)}</TableCell>
    </TableRow>
  )
}

interface SizeComparisonTableProps {
  entries: BacktestAtSize[]
  selectedSize: number | null
}

/**
 * Os tamanhos de seleção lado a lado, no corte em detalhe: quantas irregularidades da janela cada top N captura e a
 * precisão que se paga por isso.
 *
 * @param props - O resultado do corte em cada tamanho e o tamanho em destaque.
 * @returns Tabela com uma linha por tamanho, ou nada quando só um tamanho foi medido.
 */
export function SizeComparisonTable({ entries, selectedSize }: SizeComparisonTableProps) {
  if (entries.length < 2) return null
  return (
    <Table>
      <TableCaption className="sr-only">O corte em detalhe medido em cada tamanho de seleção</TableCaption>
      <TableColumns columns={COLUMNS} />
      <TableBody>
        {entries.map((entry) => (
          <SizeRow key={entry.tamanho} entry={entry} isSelected={entry.tamanho === selectedSize} />
        ))}
      </TableBody>
    </Table>
  )
}
