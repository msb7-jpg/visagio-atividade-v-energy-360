import { FileSearch, Wallet } from 'lucide-react'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { CustomerHistory, Invoice } from '@/features/customer360/types/customer360Types'
import {
  formatCompetencia,
  formatCount,
  formatDate,
  formatFlag,
  formatKwh,
  formatMoney,
  PAYMENT_STATUS
} from '@/features/customer360/utils/customer360Formatters'

function PaymentStatusBadge({ status }: { status: string | null }) {
  const statusStyle = status ? PAYMENT_STATUS[status] : undefined
  return <Badge variant={statusStyle?.variant ?? 'outline'}>{statusStyle?.label ?? status ?? '—'}</Badge>
}

function OpenInvoicesSummary({ openInvoices, openAmount }: { openInvoices: Invoice[], openAmount: number }) {
  const hasOpenInvoices = openInvoices.length > 0
  return (
    <div className="bg-muted flex items-center gap-3 rounded-xl p-3">
      <Wallet className="text-primary size-5" />
      <span className="text-foreground text-sm">
        {hasOpenInvoices
          ? `${formatCount(openInvoices.length, 'fatura', 'faturas')} em aberto, total de ${formatMoney(openAmount)}.`
          : 'Nenhuma fatura em aberto.'}
      </span>
    </div>
  )
}

interface InvoicesTabProps {
  history: CustomerHistory
}

/**
 * Aba de faturas: total em aberto e histórico com bandeira e situação de pagamento.
 *
 * @param props - Histórico retornado por `/history`.
 * @returns Resumo das faturas em aberto e tabela de faturas.
 */
export function InvoicesTab({ history }: InvoicesTabProps) {
  if (history.faturas.length === 0) {
    return (
      <EmptyState
        title="Nenhuma fatura encontrada"
        description="Não constam faturas para esta unidade consumidora."
        icon={<FileSearch className="size-10" />}
      />
    )
  }
  return (
    <div className="flex flex-col gap-3">
      <OpenInvoicesSummary openInvoices={history.faturas_em_aberto} openAmount={history.valor_em_aberto_rs} />
      <div className="max-h-96 min-w-0 overflow-auto">
        <Table aria-label="Faturas da unidade consumidora">
          <TableHeader>
            <TableRow>
              <TableHead>Competência</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Consumo</TableHead>
              <TableHead>Bandeira</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.faturas.map((invoice) => (
              <TableRow key={invoice.id_fatura}>
                <TableCell>{formatCompetencia(invoice.competencia)}</TableCell>
                <TableCell><PaymentStatusBadge status={invoice.status_pagamento} /></TableCell>
                <TableCell><span className="font-semibold">{formatMoney(invoice.valor_total_rs)}</span></TableCell>
                <TableCell>{formatDate(invoice.data_vencimento)}</TableCell>
                <TableCell>{formatKwh(invoice.consumo_faturado_kwh)}</TableCell>
                <TableCell><Badge variant="outline">{formatFlag(invoice.bandeira_tarifaria)}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
