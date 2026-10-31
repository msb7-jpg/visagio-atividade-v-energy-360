import { describe, expect, it } from 'vitest'
import type { CustomerEventTimeline, CustomerHistory } from '@/features/customer360/types/customer360Types'
import { buildCustomerInsightMetrics } from '@/features/customer360/utils/insightMetrics'

const history: CustomerHistory = {
  id_uc: 'UC100001',
  competencia_referencia: null,
  meses: [],
  resumo_12_meses: null,
  diagnostico: null,
  faturas: [],
  faturas_em_aberto: [],
  valor_em_aberto_rs: 0,
  pontualidade: null
}

const events: CustomerEventTimeline = {
  id_uc: 'UC100001',
  alimentador: 'ALM-REC-001',
  qualidade_alimentador: [],
  interrupcoes_uc: [],
  resumo_interrupcoes_uc: { total_interrupcoes: 3, total_horas: 7.5, mais_longa: null },
  chamados: [],
  inspecoes: []
}

describe('buildCustomerInsightMetrics', () => {
  it('manda só o que existe quando a UC ainda não tem diagnóstico', () => {
    const metrics = buildCustomerInsightMetrics(history, events, { hasSolar: true, connectedAt: '2025-09-15' })

    expect(metrics).toEqual({
      faturas_em_aberto: 0,
      valor_em_aberto_rs: 0,
      interrupcoes_da_uc: 3,
      horas_sem_energia_da_uc: 7.5,
      chamados: 0,
      inspecoes_de_perdas: 0,
      possui_painel_solar: 'sim'
    })
  })
})
