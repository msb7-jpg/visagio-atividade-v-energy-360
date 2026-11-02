import { describe, expect, it } from 'vitest'
import type { CustomerEventTimeline, CustomerHistory, Invoice } from '@/features/customer360/types/customer360Types'
import { buildAttentionItems } from '@/features/customer360/utils/attentionItems'

function invoice(status: string, valor: number): Invoice {
  return {
    id_fatura: `F-${status}-${valor}`,
    competencia: '2026-06',
    data_vencimento: '2026-07-10',
    data_pagamento: null,
    valor_total_rs: valor,
    consumo_faturado_kwh: 100,
    bandeira_tarifaria: 'VERDE',
    tarifa_aplicada_rs_kwh: 0.8,
    status_pagamento: status
  } as Invoice
}

function history(openInvoices: Invoice[], tendency: 'SUBIU' | 'ESTAVEL' = 'ESTAVEL'): CustomerHistory {
  return {
    faturas_em_aberto: openInvoices,
    diagnostico: {
      competencia_referencia: '2026-06',
      tendencia_consumo: tendency,
      variacao_consumo_pct: tendency === 'SUBIU' ? 40 : 2,
      leitura_estimada: false
    }
  } as unknown as CustomerHistory
}

const quietEvents = { qualidade_alimentador: [], chamados: [] } as unknown as CustomerEventTimeline

describe('buildAttentionItems', () => {
  it('não aponta nada quando a UC está em dia', () => {
    expect(buildAttentionItems(history([]), quietEvents)).toEqual([])
  })

  it('separa fatura vencida (urgente, primeiro) da fatura em aberto no prazo e soma os valores', () => {
    const items = buildAttentionItems(history([invoice('ABERTA', 100), invoice('VENCIDA', 50), invoice('VENCIDA', 25)], 'SUBIU'), quietEvents)

    expect(items.map((item) => [item.key, item.tone])).toEqual([
      ['faturas-vencidas', 'destructive'],
      ['faturas-no-prazo', 'warning'],
      ['consumo-subiu', 'warning']
    ])
    expect(items[0].label).toBe('2 faturas vencidas')
    expect(items[0].detail).toMatch(/R\$\s75,00/)
  })

  it('usa só o que já carregou', () => {
    expect(buildAttentionItems(undefined, undefined)).toEqual([])
  })
})
