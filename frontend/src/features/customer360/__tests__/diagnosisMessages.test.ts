import { describe, expect, it } from 'vitest'
import type { HighBillDiagnosis } from '@/features/customer360/types/customer360Types'
import { describeBillingDays, describeFlagChange } from '@/features/customer360/utils/diagnosisMessages'

const base: HighBillDiagnosis = {
  competencia_referencia: '2026-06',
  competencia_comparada: '2025-06',
  consumo_kwh: 240,
  consumo_kwh_ano_anterior: 200,
  variacao_consumo_pct: 20,
  tendencia_consumo: 'SUBIU',
  bandeira_atual: 'AMARELA',
  bandeira_ano_anterior: 'VERMELHA_P1',
  bandeira_mudou: true,
  dias_faturamento: 36,
  dias_faturamento_ano_anterior: 30,
  media_diaria_kwh: 6.67,
  media_diaria_kwh_ano_anterior: 6.67,
  variacao_media_diaria_pct: 0,
  tendencia_media_diaria: 'ESTAVEL',
  tarifa_rs_kwh: null,
  tarifa_rs_kwh_ano_anterior: null,
  variacao_tarifa_pct: null
}

describe('describeBillingDays', () => {
  it('explica quando os dias a mais mudam a conclusão', () => {
    expect(describeBillingDays(base)).toMatch(/36 dias de faturamento contra 30; por dia, o consumo ficou estável/)
  })

  it('não comenta diferença pequena de dias', () => {
    expect(describeBillingDays({ ...base, dias_faturamento: 32 })).toBeNull()
  })

  it('não comenta quando o consumo por dia segue a mesma tendência do total', () => {
    expect(describeBillingDays({ ...base, tendencia_media_diaria: 'SUBIU' })).toBeNull()
  })
})

describe('describeFlagChange', () => {
  it('diz quando a bandeira barateou a conta', () => {
    expect(describeFlagChange(base)).toBe('A bandeira tarifária ficou mais barata (de Vermelha P1 para Amarela), o que reduz o valor da conta.')
  })

  it('diz quando a bandeira encareceu a conta', () => {
    expect(describeFlagChange({ ...base, bandeira_atual: 'VERMELHA_P2', bandeira_ano_anterior: 'VERDE' })).toMatch(/ficou mais cara/)
  })
})
