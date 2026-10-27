import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { SortableHead } from '@/features/revenue/components/SortableHead'
import type {
  BreakdownControls,
  BreakdownLevel,
  BreakdownRow,
  BreakdownSortField,
  NeighborhoodRef
} from '@/features/revenue/types/revenueTypes'
import {
  formatMwh,
  formatSignedCurrency,
  formatCurrency,
  formatVariation
} from '@/features/revenue/utils/revenueFormatters'
import { cn } from '@/lib/utils'

const LEVEL_LABELS: Record<BreakdownLevel, string> = {
  bairro: 'Bairro',
  municipio: 'Município',
  classe_consumo: 'Classe de consumo'
}

interface BreakdownTableProps {
  rows: BreakdownRow[]
  controls: BreakdownControls
  onSort: (field: BreakdownSortField) => void
  onSelect: (neighborhood: NeighborhoodRef) => void
}

function rowKey(row: BreakdownRow): string {
  return [row.municipio, row.bairro, row.classe_consumo].join('|')
}

function NumberCell({ children, tone = 'text-foreground' }: { children: ReactNode; tone?: string }) {
  return (
    <TableCell>
      <div className={cn('text-right tabular-nums', tone)}>{children}</div>
    </TableCell>
  )
}

function SignedCell({ value }: { value: number }) {
  return <NumberCell tone={value < 0 ? 'text-destructive' : 'text-foreground'}>{formatSignedCurrency(value)}</NumberCell>
}

function NameCell({ row, level, onSelect }: { row: BreakdownRow; level: BreakdownLevel; onSelect: BreakdownTableProps['onSelect'] }) {
  if (level === 'bairro' && row.municipio && row.bairro) {
    const neighborhood = { municipio: row.municipio, bairro: row.bairro }
    return (
      <TableCell>
        <div className="flex flex-col items-start">
          <Button variant="ghost" size="sm" onClick={() => onSelect(neighborhood)}>
            {row.bairro}
          </Button>
          <span className="text-muted-foreground px-3 text-xs">{row.municipio}</span>
        </div>
      </TableCell>
    )
  }
  const name = level === 'municipio' ? row.municipio : row.classe_consumo
  return (
    <TableCell>
      <span className="text-foreground font-medium">{name ?? '—'}</span>
    </TableCell>
  )
}

/**
 * Tabela do ranking de variação de receita: volume, receita e efeitos por bairro, município ou classe.
 * No nível de bairro, o nome abre o histórico mensal.
 *
 * @param props - Linhas da página, ordenação ativa e callbacks de ordenar e abrir o histórico.
 * @returns Tabela com cabeçalhos ordenáveis.
 */
export function BreakdownTable({ rows, controls, onSort, onSelect }: BreakdownTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{LEVEL_LABELS[controls.nivel]}</TableHead>
          <TableHead className="text-right">Volume atual</TableHead>
          <SortableHead field="receita_atual_rs" label="Receita atual" controls={controls} onSort={onSort} />
          <SortableHead field="efeito_preco_rs" label="Efeito-preço" controls={controls} onSort={onSort} />
          <SortableHead field="efeito_volume_rs" label="Efeito-volume" controls={controls} onSort={onSort} />
          <SortableHead field="variacao_rs" label="Variação" controls={controls} onSort={onSort} />
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={rowKey(row)}>
            <NameCell row={row} level={controls.nivel} onSelect={onSelect} />
            <NumberCell>
              {formatMwh(row.volume_atual_kwh)}
              <span className="text-muted-foreground block text-xs">{formatVariation(row.variacao_volume_pct)}</span>
            </NumberCell>
            <NumberCell>{formatCurrency(row.receita_atual_rs)}</NumberCell>
            <SignedCell value={row.efeito_preco_rs} />
            <SignedCell value={row.efeito_volume_rs} />
            <SignedCell value={row.variacao_rs} />
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
