import { describe, expect, it } from 'vitest'
import type { HighBillDiagnosis } from '@/features/customer360/types/customer360Types'
import {
  describeBillingDays,
  describeConsumption,
  describeEstimatedReading,
  describeFlagChange,
  describeSolar,
  describeTariffChange
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
    expect(describeBillingDays(base)).toEqual({
      label: '36 dias faturados (antes 30)',
      detail: 'Por dia, o consumo ficou estável: 6,7 kWh/dia vs 6,7 kWh/dia.'
    })
  })

  it('não comenta diferença pequena de dias', () => {
    expect(describeBillingDays({ ...base, dias_faturamento: 32 })).toBeNull()
  })

  it('não comenta quando o consumo por dia segue a mesma tendência do total', () => {
    expect(describeBillingDays({ ...base, tendencia_media_diaria: 'SUBIU' })).toBeNull()
  })
})

describe('describeConsumption', () => {
  it('resume os meses e os consumos comparados', () => {
    expect(describeConsumption(base)).toBe('jun/2026 vs jun/2025: 240 kWh vs 200 kWh')
  })

  it('aponta o mês atual quando é ele que está sem leitura', () => {
    const missingCurrent = { ...base, consumo_kwh: null, variacao_consumo_pct: null, tendencia_consumo: 'SEM_COMPARACAO' as const }

    expect(describeConsumption(missingCurrent)).toBe('Sem leitura de jun/2026 para comparar com jun/2025.')
  })

  it('aponta o ano anterior quando é ele que está sem leitura', () => {
    const missingPrevious = { ...base, consumo_kwh_ano_anterior: null, variacao_consumo_pct: null, tendencia_consumo: 'SEM_COMPARACAO' as const }

    expect(describeConsumption(missingPrevious)).toBe('Sem leitura de jun/2025 para comparar com jun/2026.')
  })
})

describe('describeEstimatedReading', () => {
  it('avisa quando a leitura do mês foi estimada pela média', () => {
    expect(describeEstimatedReading({ ...base, leitura_estimada: true })).toEqual({
      label: 'Leitura estimada',
      detail: expect.stringMatching(/^A leitura de jun\/2026 foi estimada pela média/)
    })
  })

  it('não comenta leitura real', () => {
    expect(describeEstimatedReading(base)).toBeNull()
  })
})

describe('describeSolar', () => {
  it('destaca o painel ligado entre os dois meses comparados', () => {
    expect(describeSolar(base, '2025-09-15')).toEqual({
      label: 'Painel solar desde set/2025',
      detail: expect.stringMatching(/^O painel foi ligado depois de jun\/2025/)
    })
  })

  it('usa a explicação geral quando o painel já existia no ano anterior ou a data falta', () => {
    const general = { label: 'Geração solar', detail: 'A energia gerada é abatida do consumo faturado.' }

    expect(describeSolar(base, '2023-03-01')).toEqual(general)
    expect(describeSolar(base, null)).toEqual(general)
  })
})

describe('describeFlagChange', () => {
  it('diz quando a bandeira barateou a conta', () => {
    expect(describeFlagChange(base)).toEqual({
      label: 'Bandeira: Vermelha P1 → Amarela',
      detail: 'Bandeira mais barata: reduz o valor da conta.'
    })
  })

  it('diz quando a bandeira encareceu a conta', () => {
    expect(describeFlagChange({ ...base, bandeira_atual: 'VERMELHA_P2', bandeira_ano_anterior: 'VERDE' })).toEqual({
      label: 'Bandeira: Verde → Vermelha P2',
      detail: expect.stringMatching(/mais cara/)
    })
  })

  it('não comenta quando a bandeira não mudou', () => {
    expect(describeFlagChange({ ...base, bandeira_mudou: false })).toBeNull()
  })
})

describe('describeTariffChange', () => {
  const withTariff = { ...base, tarifa_rs_kwh: 0.92, tarifa_rs_kwh_ano_anterior: 0.8, variacao_tarifa_pct: 15 }

  it('resume a alta do preço do kWh em chip e frase', () => {
    expect(describeTariffChange(withTariff)).toEqual({
      label: 'Preço do kWh +15%',
      detail: expect.stringMatching(/^O preço médio do kWh subiu 15% \(/)
    })
  })

  it('ignora variação abaixo de 1% ou sem fatura para comparar', () => {
    expect(describeTariffChange({ ...withTariff, variacao_tarifa_pct: 0.5 })).toBeNull()
    expect(describeTariffChange({ ...withTariff, variacao_tarifa_pct: null })).toBeNull()
  })
})
