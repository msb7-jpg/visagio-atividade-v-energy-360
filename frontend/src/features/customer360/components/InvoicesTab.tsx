import { CalendarCheck, FileSearch, Wallet } from 'lucide-react'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/status-badge'
import { Table, TableBody, TableCell, TableColumns, TableRow } from '@/components/ui/table'
import type { CustomerHistory, Invoice, PaymentPunctuality } from '@/features/customer360/types/customer360Types'
import {
  formatCompetencia,
  formatCount,
  formatDate,
  formatFlag,
  formatKwh,
  formatMoney,
  INVOICE_STATUS
} from '@/features/customer360/utils/customer360Formatters'

const COLUMNS = ['Competência', 'Situação', 'Valor', 'Vencimento', 'Consumo', 'Bandeira'] as const

function PaymentStatusBadge({ status }: { status: string | null }) {
  const invoiceStatus = status ? INVOICE_STATUS[status] : undefined
  return invoiceStatus
    ? <StatusBadge kind="fatura" status={invoiceStatus} />
    : <Badge variant="outline">{status ?? '—'}</Badge>
}

function OpenInvoicesSummary({ openInvoices, openAmount }: { openInvoices: Invoice[], openAmount: number }) {
  const hasOpenInvoices = openInvoices.length > 0
  return (
    <div className="bg-muted flex items-center gap-3 rounded-lg p-3">
      <Wallet className="text-primary size-5" />
      <span className="text-foreground text-sm">
        {hasOpenInvoices
          ? `${formatCount(openInvoices.length, 'fatura', 'faturas')} em aberto, total de ${formatMoney(openAmount)}.`
          : 'Nenhuma fatura em aberto.'}
      </span>
    </div>
  )
}

function describePunctuality(punctuality: PaymentPunctuality): string {
  const lateDetail = punctuality.atraso_medio_dias === null
    ? ''
    : ` (atraso médio de ${formatCount(punctuality.atraso_medio_dias, 'dia', 'dias')})`
  const overdueDetail = punctuality.vencidas_em_aberto > 0
    ? ` e ${formatCount(punctuality.vencidas_em_aberto, 'vencida', 'vencidas')} em aberto`
    : ''
  return `Últimas ${punctuality.faturas_avaliadas} contas: ${punctuality.pagas_em_dia} pagas em dia, `
    + `${punctuality.pagas_com_atraso} com atraso${lateDetail}${overdueDetail}.`
}

function PunctualitySummary({ punctuality }: { punctuality: PaymentPunctuality }) {
  return (
    <div className="bg-muted flex items-center gap-3 rounded-lg p-3">
      <CalendarCheck className="text-primary size-5" />
      <span className="text-foreground text-sm">{describePunctuality(punctuality)}</span>
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
      {history.pontualidade ? <PunctualitySummary punctuality={history.pontualidade} /> : null}
      <div className="max-h-96 min-w-0 overflow-auto">
        <Table aria-label="Faturas da unidade consumidora">
          <TableColumns columns={COLUMNS} />
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
