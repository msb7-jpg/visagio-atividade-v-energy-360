import { CircleDashed, type LucideIcon } from 'lucide-react'
import { Badge, type BadgeProps } from '@/components/ui/badge'

interface StatusEntry {
  label: string
  tone: NonNullable<BadgeProps['variant']>
  icon?: LucideIcon
}

/**
 * Vocabulário fechado de cada tipo (design: "Sempre texto + cor").
 * success = concluído/pago, warning = aguarda ação, destructive = atrasado, accent = em andamento, muted = neutro.
 */
const STATUS_VOCABULARY = {
  fatura: {
    paga: { label: 'Paga', tone: 'success' },
    em_aberto: { label: 'Em aberto', tone: 'warning' },
    vencida: { label: 'Vencida', tone: 'destructive' }
  },
  ordem: {
    na_fila: { label: 'Na fila', tone: 'muted' },
    pendente: { label: 'Pendente', tone: 'warning' },
    ordem_gerada: { label: 'Ordem gerada', tone: 'warning' },
    em_campo: { label: 'Em campo', tone: 'accent' },
    concluida: { label: 'Concluída', tone: 'success' },
    cancelada: { label: 'Cancelada', tone: 'muted' }
  },
  leitura: {
    real: { label: 'Real', tone: 'muted' },
    estimada: { label: 'Estimada', tone: 'accent', icon: CircleDashed }
  }
} as const satisfies Record<string, Record<string, StatusEntry>>

type StatusKind = keyof typeof STATUS_VOCABULARY

/** Estados válidos de um tipo de selo. */
export type StatusOf<Kind extends StatusKind> = keyof (typeof STATUS_VOCABULARY)[Kind]

interface StatusBadgeProps<Kind extends StatusKind> {
  kind: Kind
  status: StatusOf<Kind>
}

/**
 * Selo de estado de fatura, ordem de inspeção ou leitura, com rótulo e tom fixos por tipo.
 *
 * @param props - Tipo do selo e um estado do vocabulário desse tipo.
 * @returns Badge com texto, cor semântica e, quando houver, ícone decorativo.
 */
export function StatusBadge<Kind extends StatusKind>({ kind, status }: StatusBadgeProps<Kind>) {
  const entry = (STATUS_VOCABULARY[kind] as Record<string, StatusEntry>)[status as string]
  const Icon = entry.icon

  return (
    <Badge variant={entry.tone} data-testid="status-badge" className="gap-1">
      {Icon ? <Icon aria-hidden="true" className="size-3" /> : null}
      {entry.label}
    </Badge>
  )
}
