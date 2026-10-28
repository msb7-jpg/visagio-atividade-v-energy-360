import { describe, expect, it } from 'vitest'
import type { HighBillDiagnosis } from '@/features/customer360/types/customer360Types'
import {
  describeBillingDays,
  describeConsumption,
  describeEstimatedReading,
  describeFlagChange,
  describeSolar
} from '@/features/customer360/utils/diagnosisMessages'

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
  variacao_tarifa_pct: null,
  leitura_estimada: false
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

describe('describeConsumption', () => {
  it('aponta o mês atual quando é ele que está sem leitura', () => {
    const missingCurrent = { ...base, consumo_kwh: null, variacao_consumo_pct: null, tendencia_consumo: 'SEM_COMPARACAO' as const }

    expect(describeConsumption(missingCurrent)).toBe('Não há leitura de jun/2026 para comparar com jun/2025.')
  })

  it('aponta o ano anterior quando é ele que está sem leitura', () => {
    const missingPrevious = { ...base, consumo_kwh_ano_anterior: null, variacao_consumo_pct: null, tendencia_consumo: 'SEM_COMPARACAO' as const }

    expect(describeConsumption(missingPrevious)).toBe('Não há leitura de jun/2025 para comparar com jun/2026.')
  })
})

describe('describeEstimatedReading', () => {
  it('avisa quando a leitura do mês foi estimada pela média', () => {
    expect(describeEstimatedReading({ ...base, leitura_estimada: true })).toMatch(/^A leitura de jun\/2026 foi estimada pela média/)
  })

  it('não comenta leitura real', () => {
    expect(describeEstimatedReading(base)).toBeNull()
  })
})

describe('describeSolar', () => {
  it('destaca o painel ligado entre os dois meses comparados', () => {
    expect(describeSolar(base, '2025-09-15')).toMatch(/^O painel solar foi ligado em set\/2025, depois de jun\/2025/)
  })

  it('usa a explicação geral quando o painel já existia no ano anterior ou a data falta', () => {
    expect(describeSolar(base, '2023-03-01')).toBe('A UC tem geração solar: a energia gerada é abatida do consumo faturado.')
    expect(describeSolar(base, null)).toBe('A UC tem geração solar: a energia gerada é abatida do consumo faturado.')
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
