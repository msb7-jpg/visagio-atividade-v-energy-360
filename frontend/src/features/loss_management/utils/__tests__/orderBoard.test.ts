import { describe, expect, it } from 'vitest'
import type { InspectionOrder } from '@/features/loss_management/types/lossTypes'
import {
  ACTIONS_BY_STATUS,
  BOARD_COLUMNS,
  formatOrderCode,
  groupOrdersByStatus,
  summarizeFieldResult
} from '@/features/loss_management/utils/orderBoard'

function buildOrder(overrides: Partial<InspectionOrder>): InspectionOrder {
  return {
    id_inspecao: 412,
    id_uc: 'UC131844',
    status: 'gerada',
    motivo: null,
    kwh_estimado: 0,
    fiscal_responsavel: null,
    irregularidade_constatada: null,
    tipo_irregularidade: null,
    kwh_recuperado: null,
    numero_toi: null,
    justificativa_cancelamento: null,
    criado_por: 'teste@exemplo.com',
    criado_em: '2026-06-26T10:00:00',
    atualizado_em: '2026-06-26T10:00:00',
    ...overrides
  }
}

describe('quadro de ordens', () => {
  it('mostra as colunas na ordem do fluxo com os rótulos de negócio', () => {
    expect(BOARD_COLUMNS.map((column) => column.label)).toEqual(['Pendente', 'Em campo', 'Concluída', 'Cancelada'])
  })

  it('só oferece ações coerentes com as transições permitidas no servidor', () => {
    expect(ACTIONS_BY_STATUS.gerada).toEqual(['dispatch', 'cancel'])
    expect(ACTIONS_BY_STATUS.pendente).toEqual(['result', 'cancel'])
    expect(ACTIONS_BY_STATUS.concluida).toEqual([])
    expect(ACTIONS_BY_STATUS.cancelada).toEqual([])
  })

  it('agrupa por status e deixa vazia a coluna sem ordens', () => {
    const grouped = groupOrdersByStatus([
      buildOrder({ id_inspecao: 1 }),
      buildOrder({ id_inspecao: 2, status: 'pendente' }),
      buildOrder({ id_inspecao: 3 })
    ])

    expect(grouped.gerada.map((order) => order.id_inspecao)).toEqual([1, 3])
    expect(grouped.pendente).toHaveLength(1)
    expect(grouped.concluida).toEqual([])
  })

  it('formata o código da ordem como OI-AAAA-NNNN', () => {
    expect(formatOrderCode(buildOrder({}))).toBe('OI-2026-0412')
    expect(formatOrderCode(buildOrder({ id_inspecao: 12345 }))).toBe('OI-2026-12345')
  })

  it('não resume resultado enquanto a ordem não foi concluída', () => {
    expect(summarizeFieldResult(buildOrder({}))).toBeNull()
  })

  it('resume irregularidade confirmada com tipo e kWh', () => {
    const summary = summarizeFieldResult(
      buildOrder({ irregularidade_constatada: true, tipo_irregularidade: 'DESVIO DIRETO', kwh_recuperado: 1240 })
    )

    expect(summary?.text).toBe('Irregularidade confirmada · DESVIO DIRETO · 1.240 kWh')
  })

  it('resume ausência de irregularidade', () => {
    expect(summarizeFieldResult(buildOrder({ irregularidade_constatada: false }))?.text).toBe('Sem irregularidade')
  })
})
