import { describe, expect, it } from 'vitest'
import {
  formatCompetencia,
  formatCount,
  formatCurrency,
  formatMwh,
  formatSignedCompactCurrency,
  formatSignedCurrency,
  formatTariff,
  formatVariation
} from '@/features/revenue/utils/revenueFormatters'

const NBSP = ' '

describe('revenueFormatters', () => {
  it('formata valores monetários em pt-BR', () => {
    expect(formatCurrency(1040.88)).toBe(`R$${NBSP}1.040,88`)
  })

  it('converte kWh em MWh', () => {
    expect(formatMwh(100560)).toBe('100,6 MWh')
  })

  it('formata a tarifa média com três casas por kWh', () => {
    expect(formatTariff(0.6211)).toBe(`R$${NBSP}0,621/kWh`)
  })

  it('formata contagens como inteiros', () => {
    expect(formatCount(12345)).toBe('12.345')
  })

  it('mostra o sinal da variação percentual', () => {
    expect(formatVariation(2)).toBe('+2,0%')
    expect(formatVariation(-4)).toBe('-4,0%')
    expect(formatVariation(0)).toBe('0,0%')
  })

  it.each([
    ['formatCurrency', formatCurrency],
    ['formatMwh', formatMwh],
    ['formatTariff', formatTariff],
    ['formatCount', formatCount],
    ['formatVariation', formatVariation]
  ])('%s devolve um travessão quando não há valor', (_name, formatter) => {
    expect(formatter(null)).toBe('—')
  })

  it('formata valor com sinal explícito, sem sinal no zero', () => {
    expect(formatSignedCurrency(-2587.2)).toBe(`-R$${NBSP}2.587,20`)
    expect(formatSignedCurrency(1250.4)).toBe(`+R$${NBSP}1.250,40`)
    expect(formatSignedCurrency(0)).toBe(`R$${NBSP}0,00`)
  })

  it('formata valor compacto com sinal', () => {
    expect(formatSignedCompactCurrency(-2587.2)).toContain('2,6')
    expect(formatSignedCompactCurrency(-2587.2).startsWith('-')).toBe(true)
  })

  it('converte a competência em rótulo curto e preserva texto inválido', () => {
    expect(formatCompetencia('2026-06')).toBe('jun. de 26')
    expect(formatCompetencia('lixo')).toBe('lixo')
  })
})
