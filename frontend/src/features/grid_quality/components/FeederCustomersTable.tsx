import { Link } from 'react-router-dom'
import { Table, TableBody, TableCell, TableColumns, TableRow } from '@/components/ui/table'
import { formatInteger } from '@/features/grid_quality/utils/continuityFormatters'
import { formatDecimal } from '@/features/grid_quality/utils/qualityFormatters'
import type { AffectedCustomer } from '@/features/grid_quality/types/qualityTypes'

const COLUMNS = ['UC', 'Bairro', 'Horas sem energia', 'Ocorrências', 'Ficha'] as const

/**
 * Clientes de um alimentador ordenados pelas horas sem energia, com link para a Visão 360 da UC.
 *
 * @param props - UCs já ordenadas pela API.
 * @returns Tabela com uma linha por UC e o link "Ver ficha" para `/customers?uc=`.
 */
export function FeederCustomersTable({ customers }: { customers: AffectedCustomer[] }) {
  return (
    <Table>
      <TableColumns columns={COLUMNS} />
      <TableBody>
        {customers.map((customer) => (
          <TableRow key={customer.id_uc}>
            <TableCell>
              <div className="flex flex-col">
                <span className="font-mono">{customer.id_uc}</span>
                <span className="text-muted-foreground text-xs">{customer.nome_titular ?? '—'}</span>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex flex-col">
                <span>{customer.bairro ?? '—'}</span>
                <span className="text-muted-foreground text-xs">{customer.municipio ?? '—'}</span>
              </div>
            </TableCell>
            <TableCell><strong>{formatDecimal(customer.horas_sem_energia)} h</strong></TableCell>
            <TableCell>{formatInteger(customer.ocorrencias)}</TableCell>
            <TableCell>
              <Link className="text-primary underline" to={`/customers?uc=${encodeURIComponent(customer.id_uc)}`}>
                Ver ficha
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
