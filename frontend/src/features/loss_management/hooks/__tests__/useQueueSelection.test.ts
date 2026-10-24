import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useQueueSelection } from '@/features/loss_management/hooks/useQueueSelection'
import type { QueueSituation, SuspiciousUnit } from '@/features/loss_management/types/lossTypes'

function makeUnit(idUc: string, situacao: QueueSituation = 'na_fila'): SuspiciousUnit {
  return {
    id_uc: idUc,
    municipio: 'Recife',
    bairro: 'Boa Viagem',
    classe_consumo: 'Residencial',
    motivos: ['queda_subita'],
    score_risco: 60,
    score: 80,
    situacao,
    probabilidade_acerto: 0.93,
    consumo_base_kwh: 300,
    consumo_recente_kwh: 50,
    kwh_estimado_recuperar: 750,
    valor_estimado_recuperar_rs: 535.5,
    kwh_mes_recuperavel: 250,
    valor_ano_rs: 2142
  }
}

const QUEUE = [
  makeUnit('UC1', 'ordem_gerada'),
  makeUnit('UC2'),
  makeUnit('UC3'),
  makeUnit('UC4', 'em_campo'),
  makeUnit('UC5'),
  makeUnit('UC6')
]

describe('useQueueSelection', () => {
  it('começa sem nada selecionado', () => {
    const { result } = renderHook(() => useQueueSelection(QUEUE))

    expect(result.current.selectedIds).toEqual([])
    expect(result.current.allSelected).toBe(false)
  })

  it('marca e desmarca uma UC livre', () => {
    const { result } = renderHook(() => useQueueSelection(QUEUE))

    act(() => result.current.toggle('UC2'))
    expect(result.current.selectedIds).toEqual(['UC2'])
    expect(result.current.isSelected('UC2')).toBe(true)

    act(() => result.current.toggle('UC2'))
    expect(result.current.selectedIds).toEqual([])
  })

  it('não deixa selecionar UC com ordem gerada ou em campo', () => {
    const { result } = renderHook(() => useQueueSelection(QUEUE))

    act(() => result.current.toggle('UC1'))
    act(() => result.current.toggle('UC4'))

    expect(result.current.selectedIds).toEqual([])
    expect(result.current.isSelectable(QUEUE[0])).toBe(false)
    expect(result.current.isSelectable(QUEUE[1])).toBe(true)
  })

  it('seleciona o topo da fila pulando as UCs que já têm ordem', () => {
    const { result } = renderHook(() => useQueueSelection(QUEUE))

    act(() => result.current.selectTop(3))

    expect(result.current.selectedIds).toEqual(['UC2', 'UC3', 'UC5'])
  })

  it('substitui a seleção anterior ao selecionar o topo', () => {
    const { result } = renderHook(() => useQueueSelection(QUEUE))
    act(() => result.current.toggle('UC6'))

    act(() => result.current.selectTop(1))

    expect(result.current.selectedIds).toEqual(['UC2'])
  })

  it('seleciona todas as livres e, no segundo acionamento, limpa a seleção', () => {
    const { result } = renderHook(() => useQueueSelection(QUEUE))

    act(() => result.current.toggleAll())
    expect(result.current.selectedIds).toEqual(['UC2', 'UC3', 'UC5', 'UC6'])
    expect(result.current.allSelected).toBe(true)

    act(() => result.current.toggleAll())
    expect(result.current.selectedIds).toEqual([])
  })

  it('descarta da seleção as UCs que saíram da lista depois de um filtro', () => {
    const { result, rerender } = renderHook(({ units }) => useQueueSelection(units), {
      initialProps: { units: QUEUE }
    })
    act(() => result.current.toggleAll())

    rerender({ units: [QUEUE[1], QUEUE[2]] })

    expect(result.current.selectedIds).toEqual(['UC2', 'UC3'])
  })

  it('devolve a marcação das UCs que voltam à lista quando o filtro é removido', () => {
    const { result, rerender } = renderHook(({ units }) => useQueueSelection(units), {
      initialProps: { units: QUEUE }
    })
    act(() => result.current.toggleAll())
    rerender({ units: [QUEUE[1]] })
    expect(result.current.selectedIds).toEqual(['UC2'])

    rerender({ units: QUEUE })

    expect(result.current.selectedIds).toEqual(['UC2', 'UC3', 'UC5', 'UC6'])
  })

  it('limpa a seleção', () => {
    const { result } = renderHook(() => useQueueSelection(QUEUE))
    act(() => result.current.toggleAll())

    act(() => result.current.clear())

    expect(result.current.selectedIds).toEqual([])
  })

  it('não considera tudo selecionado quando a lista não tem UC livre', () => {
    const { result } = renderHook(() => useQueueSelection([makeUnit('UC1', 'em_campo')]))

    expect(result.current.allSelected).toBe(false)
  })
})
