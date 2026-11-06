import type { ReactNode } from 'react'
import { FileSearch } from 'lucide-react'
import { StatTile } from '@/components/data/StatTile'
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

function OpenInvoicesTile({ openInvoices, openAmount }: { openInvoices: Invoice[], openAmount: number }) {
  const hasOpenInvoices = openInvoices.length > 0
  return (
    <StatTile
      label="Em aberto"
      value={hasOpenInvoices ? formatMoney(openAmount) : formatMoney(0)}
      footnote={hasOpenInvoices ? `${formatCount(openInvoices.length, 'fatura', 'faturas')} sem pagamento` : 'Nenhuma fatura em aberto'}
    />
  )
}

function describeLateness(punctuality: PaymentPunctuality): string {
  const parts = [`${punctuality.pagas_com_atraso} com atraso`]
  if (punctuality.atraso_medio_dias !== null) parts.push(`atraso médio de ${formatCount(punctuality.atraso_medio_dias, 'dia', 'dias')}`)
  if (punctuality.vencidas_em_aberto > 0) parts.push(`${formatCount(punctuality.vencidas_em_aberto, 'vencida', 'vencidas')} em aberto`)
  return parts.join(' · ')
}

function PunctualityTile({ punctuality }: { punctuality: PaymentPunctuality }) {
  return (
    <StatTile
      label={`Pagas em dia (últimas ${punctuality.faturas_avaliadas})`}
      value={`${punctuality.pagas_em_dia} de ${punctuality.faturas_avaliadas}`}
      footnote={describeLateness(punctuality)}
    />
  )
}

interface InvoicesTabProps {
  history: CustomerHistory
  /** Resposta a "conta alta?", ao lado dos totais em aberto e da pontualidade. */
  diagnosis?: ReactNode
}

/**
 * Faturas do bloco "Histórico financeiro": total em aberto e histórico com bandeira e situação de pagamento.
 *
 * @param props - Histórico retornado por `/history`.
 * @returns Resumo das faturas em aberto e tabela de faturas.
 */
export function InvoicesTab({ history, diagnosis }: InvoicesTabProps) {
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
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {diagnosis ? <div className="lg:col-span-2">{diagnosis}</div> : null}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <OpenInvoicesTile openInvoices={history.faturas_em_aberto} openAmount={history.valor_em_aberto_rs} />
          {history.pontualidade ? <PunctualityTile punctuality={history.pontualidade} /> : null}
        </div>
      </div>
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
