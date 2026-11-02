import type { CustomerEventTimeline, CustomerHistory, Invoice } from '@/features/customer360/types/customer360Types'
import {
  formatCompetencia,
  formatCount,
  formatDate,
  formatMoney,
  formatPercent
} from '@/features/customer360/utils/customer360Formatters'
import { analyzeOutages } from '@/features/customer360/utils/outageAnalysis'

/** `destructive` = atrasado ou urgente; `warning` = pede atenção na ligação. */
export type AttentionTone = 'destructive' | 'warning'

export interface AttentionItem {
  key: string
  tone: AttentionTone
  label: string
  detail: string
}

function invoiceTotal(invoices: Invoice[]): number {
  return invoices.reduce((total, invoice) => total + (invoice.valor_total_rs ?? 0), 0)
}

function invoiceItems(history: CustomerHistory): AttentionItem[] {
  const overdue = history.faturas_em_aberto.filter((invoice) => invoice.status_pagamento === 'VENCIDA')
  const onTime = history.faturas_em_aberto.filter((invoice) => invoice.status_pagamento !== 'VENCIDA')
  const items: AttentionItem[] = []
  if (overdue.length > 0) {
    items.push({
      key: 'faturas-vencidas',
      tone: 'destructive',
      label: formatCount(overdue.length, 'fatura vencida', 'faturas vencidas'),
      detail: `${formatMoney(invoiceTotal(overdue))} sem pagamento depois do vencimento.`
    })
  }
  if (onTime.length > 0) {
    items.push({
      key: 'faturas-no-prazo',
      tone: 'warning',
      label: `${formatCount(onTime.length, 'fatura', 'faturas')} em aberto no prazo`,
      detail: `${formatMoney(invoiceTotal(onTime))} ainda dentro do vencimento.`
    })
  }
  return items
}

function billItems(history: CustomerHistory): AttentionItem[] {
  const diagnosis = history.diagnostico
  if (!diagnosis) return []
  const month = formatCompetencia(diagnosis.competencia_referencia)
  const items: AttentionItem[] = []
  if (diagnosis.tendencia_consumo === 'SUBIU') {
    items.push({
      key: 'consumo-subiu',
      tone: 'warning',
      label: 'Consumo em alta',
      detail: `${formatPercent(diagnosis.variacao_consumo_pct)} em ${month} contra o mesmo mês do ano anterior.`
    })
  }
  if (diagnosis.leitura_estimada) {
    items.push({ key: 'leitura-estimada', tone: 'warning', label: 'Leitura estimada', detail: `A conta de ${month} foi calculada pela média.` })
  }
  return items
}

function eventItems(events: CustomerEventTimeline): AttentionItem[] {
  const items: AttentionItem[] = []
  const { aboveNormalMonths } = analyzeOutages(events.qualidade_alimentador)
  if (aboveNormalMonths.length > 0) {
    items.push({
      key: 'falta-de-luz',
      tone: 'warning',
      label: 'Falta de luz acima do normal na região',
      detail: `${formatCount(aboveNormalMonths.length, 'mês', 'meses')} no último ano; o mais recente foi ${formatCompetencia(aboveNormalMonths[0])}.`
    })
  }
  const openTickets = events.chamados.filter((ticket) => ticket.status_chamado === 'ABERTO')
  if (openTickets.length > 0) {
    items.push({
      key: 'chamados-abertos',
      tone: 'warning',
      label: formatCount(openTickets.length, 'chamado aberto', 'chamados abertos'),
      detail: `O mais recente foi aberto em ${formatDate(openTickets[0].data_abertura)}.`
    })
  }
  return items
}

/**
 * O que o atendente precisa saber antes de qualquer outra coisa: faturas vencidas ou em aberto, consumo em alta,
 * leitura estimada, falta de luz acima do normal na região e chamados abertos. Itens urgentes vêm primeiro.
 *
 * @param history - Histórico da UC; `undefined` enquanto carrega ou se falhou.
 * @param events - Eventos da UC; `undefined` enquanto carregam ou se falharam.
 * @returns Lista de alertas, vazia quando não há nada pendente.
 */
export function buildAttentionItems(
  history: CustomerHistory | undefined,
  events: CustomerEventTimeline | undefined
): AttentionItem[] {
  const items = [
    ...(history ? invoiceItems(history) : []),
    ...(history ? billItems(history) : []),
    ...(events ? eventItems(events) : [])
  ]
  return [...items.filter((item) => item.tone === 'destructive'), ...items.filter((item) => item.tone === 'warning')]
}
