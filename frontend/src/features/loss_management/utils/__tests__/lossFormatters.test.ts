import { describe, expect, it } from 'vitest'
import {
  describeReasons,
  formatCompactCurrency,
  formatConsumptionDrop,
  formatInteger,
  formatPercent,
  formatPeriod,
  formatTariffNote,
  ordersLabel
} from '@/features/loss_management/utils/lossFormatters'

describe('formatCompactCurrency', () => {
  it.each([
    [535, 'R$ 535'],
    [999, 'R$ 999'],
    [1000, 'R$ 1,0 mil'],
    [15800, 'R$ 15,8 mil'],
    [1_200_000, 'R$ 1,2 mi']
  ])('formata %d como %s', (value, expected) => {
    expect(formatCompactCurrency(value)).toBe(expected)
  })
})

describe('formatPeriod', () => {
  it('junta os meses no mesmo ano com o ano no fim', () => {
    expect(formatPeriod('2025-08', '2025-12')).toBe('ago–dez/2025')
  })

  it('repete o ano quando o período atravessa a virada', () => {
    expect(formatPeriod('2025-11', '2026-02')).toBe('nov/2025–fev/2026')
  })
})

describe('contagens e percentuais', () => {
  it('formata inteiros com separador de milhar', () => {
    expect(formatInteger(1248)).toBe('1.248')
    expect(formatInteger(0)).toBe('0')
  })

  it('formata a taxa com uma casa decimal', () => {
    expect(formatPercent(0.627)).toBe('62,7%')
  })

  it('concorda "ordem" com a quantidade', () => {
    expect(ordersLabel(1)).toBe('ordem')
    expect(ordersLabel(0)).toBe('ordens')
    expect(ordersLabel(2)).toBe('ordens')
  })
})

describe('formatConsumptionDrop', () => {
  it.each([
    [300, 200, '−33%'],
    [300, 50, '−83%'],
    [120, 0, '−100%'],
    [100, 100, '0%'],
    [100, 130, '0%'],
    [0, 0, '—']
  ])('base %d e recente %d viram %s', (base, recent, expected) => {
    expect(formatConsumptionDrop(base, recent)).toBe(expected)
  })
})

describe('describeReasons', () => {
  it('descreve a queda moderada da fila classificada', () => {
    expect(describeReasons(['queda_moderada'])).toBe('Queda moderada de consumo')
  })

  it('usa os textos do desenho, separados por vírgula', () => {
    expect(describeReasons(['queda_subita', 'leitura_zerada'])).toBe(
      'Queda abrupta de consumo, Consumo zero com medidor ativo'
    )
  })
})

describe('formatTariffNote', () => {
  it('formata a tarifa em pt-BR com duas casas e o período de 12 meses', () => {
    expect(formatTariffNote(0.7876, '2025-07', '2026-06')).toBe('Tarifa média de 12 meses: R$ 0,79/kWh (jul/2025–jun/2026)')
  })

  it('usa vírgula decimal e arredonda para o centavo', () => {
    expect(formatTariffNote(0.7138, '2025-02', '2026-01')).toBe('Tarifa média de 12 meses: R$ 0,71/kWh (fev/2025–jan/2026)')
  })
})
