import { History } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { RecentCustomer } from '@/features/customer360/hooks/useRecentCustomers'

interface RecentCustomersProps {
  recentCustomers: RecentCustomer[]
  onSelect: (idUc: string) => void
  onClear: () => void
}

/**
 * Atalhos para as últimas UCs consultadas, úteis quando o cliente liga de novo ou a ligação cai.
 *
 * @param props - UCs recentes, callback de reabertura e de limpeza.
 * @returns Faixa de atalhos, ou nada quando ainda não há consultas.
 */
export function RecentCustomers({ recentCustomers, onSelect, onClear }: RecentCustomersProps) {
  if (recentCustomers.length === 0) {
    return null
  }
  return (
    <nav aria-label="Buscas recentes" className="flex flex-wrap items-center gap-2">
      <span className="text-muted-foreground flex items-center gap-1 text-xs font-semibold">
        <History className="size-3.5" /> Recentes
      </span>
      {recentCustomers.map((recent) => (
        <Button key={recent.id_uc} variant="outline" size="sm" onClick={() => onSelect(recent.id_uc)}>
          <span className="font-mono">{recent.id_uc}</span>
          {recent.bairro ? <span className="text-muted-foreground"> · {recent.bairro}</span> : null}
        </Button>
      ))}
      <Button variant="ghost" size="sm" onClick={onClear}>Limpar</Button>
    </nav>
  )
}
