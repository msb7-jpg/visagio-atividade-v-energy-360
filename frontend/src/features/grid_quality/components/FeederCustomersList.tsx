import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ShareBar } from '@/components/data/ShareBar'
import type { AffectedCustomer } from '@/features/grid_quality/types/qualityTypes'
import { formatInteger } from '@/features/grid_quality/utils/continuityFormatters'
import { formatDecimal } from '@/features/grid_quality/utils/qualityFormatters'
import { displayName } from '@/lib/geo/placeName'

function placeOf(customer: AffectedCustomer): string {
  return [customer.bairro, customer.municipio].filter((part) => part !== null).map((part) => displayName(part)).join(', ')
}

/**
 * Clientes do alimentador com mais horas sem energia: a linha inteira abre a UC 360, e a barra compara as
 * horas com as do cliente mais afetado.
 *
 * @param props - UCs já ordenadas pela API.
 * @returns Lista com nome, UC, local, horas e interrupções de cada cliente.
 */
export function FeederCustomersList({ customers }: { customers: AffectedCustomer[] }) {
  const scale = Math.max(...customers.map((customer) => customer.horas_sem_energia), 1)
  return (
    <ul className="divide-border flex flex-col divide-y">
      {customers.map((customer) => {
        const name = customer.nome_titular ? displayName(customer.nome_titular) : customer.id_uc
        return (
          <li key={customer.id_uc}>
            <Link
              to={`/customers?uc=${encodeURIComponent(customer.id_uc)}`}
              aria-label={`Abrir ${name} (${customer.id_uc}) na UC 360`}
              className="hover:bg-muted focus-visible:ring-ring -mx-2 flex items-center gap-3 rounded-md px-2 py-2.5 outline-none focus-visible:ring-2"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-foreground truncate text-sm font-medium">{name}</span>
                  <span className="text-foreground shrink-0 text-sm font-semibold tabular-nums">{formatDecimal(customer.horas_sem_energia)} h</span>
                </div>
                <ShareBar percent={(customer.horas_sem_energia / scale) * 100} tone="bg-chart-4" />
                <div className="text-muted-foreground flex items-baseline justify-between gap-3 text-xs">
                  <span className="truncate"><span className="font-mono">{customer.id_uc}</span> · {placeOf(customer) || 'Sem endereço'}</span>
                  <span className="shrink-0 tabular-nums">{formatInteger(customer.ocorrencias)} interrupções</span>
                </div>
              </div>
              <ChevronRight aria-hidden="true" className="text-muted-foreground size-4 shrink-0" />
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
