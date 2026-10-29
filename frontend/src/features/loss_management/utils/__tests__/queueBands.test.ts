import { describe, expect, it } from 'vitest'
import type { SuspiciousUnit } from '@/features/loss_management/types/lossTypes'
import { isPriorityUnit, splitQueueBands } from '@/features/loss_management/utils/queueBands'

function buildUnit(idUc: string, hitProbability: number): SuspiciousUnit {
  return {
    id_uc: idUc,
    municipio: 'Recife',
    bairro: 'Pina',
    classe_consumo: 'Residencial',
    motivos: ['queda_moderada'],
    score_risco: 30,
    score: 50,
    situacao: 'na_fila',
    probabilidade_acerto: hitProbability,
    meses_base: 12,
    consumo_base_kwh: 300,
    consumo_recente_kwh: 200,
    kwh_estimado_recuperar: 300,
    valor_estimado_recuperar_rs: 214,
    kwh_mes_recuperavel: 100,
    valor_ano_rs: 857
  }
}

describe('splitQueueBands', () => {
  it.each([
    [0.93, true],
    [0.627, true],
    [0.42, true],
    [0.3, true],
    [0.07, false],
    [0, false]
  ])('classifica a chance de acerto %f como prioritária = %s', (hitProbability, expected) => {
    expect(isPriorityUnit(buildUnit('UC1', hitProbability))).toBe(expected)
  })

  it('separa as faixas mantendo a ordem do backend dentro de cada uma', () => {
    const units = [buildUnit('UC1', 0.07), buildUnit('UC2', 0.42), buildUnit('UC3', 0.07), buildUnit('UC4', 0.93)]

    const { priority, lowChance } = splitQueueBands(units)

    expect(priority.map((unit) => unit.id_uc)).toEqual(['UC2', 'UC4'])
    expect(lowChance.map((unit) => unit.id_uc)).toEqual(['UC1', 'UC3'])
  })

  it('devolve faixas vazias para uma fila vazia', () => {
    expect(splitQueueBands([])).toEqual({ priority: [], lowChance: [] })
  })
})
