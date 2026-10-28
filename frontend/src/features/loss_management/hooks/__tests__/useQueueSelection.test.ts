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

  it('seleciona o topo só entre as UCs que passam no filtro informado', () => {
    const queue = [
      { ...makeUnit('UC1'), probabilidade_acerto: 0.07 },
      { ...makeUnit('UC2'), probabilidade_acerto: 0.42 },
      { ...makeUnit('UC3'), probabilidade_acerto: 0.07 },
      { ...makeUnit('UC4'), probabilidade_acerto: 0.93 }
    ]
    const { result } = renderHook(() => useQueueSelection(queue))

    act(() => result.current.selectTop(3, (unit) => unit.probabilidade_acerto >= 0.3))

    expect(result.current.selectedIds).toEqual(['UC2', 'UC4'])
  })

  it('substitui a seleção anterior ao selecionar o topo', () => {
    const { result } = renderHook(() => useQueueSelection(QUEUE))
    act(() => result.current.toggle('UC6'))

    act(() => result.current.selectTop(1))

    expect(result.current.selectedIds).toEqual(['UC2'])
  })

  it('mantém o topo marcado ao acioná-lo de novo, sem desmarcar', () => {
    const { result } = renderHook(() => useQueueSelection(QUEUE))
    act(() => result.current.selectTop(3))

    act(() => result.current.selectTop(3))

    expect(result.current.selectedIds).toEqual(['UC2', 'UC3', 'UC5'])
  })

  it('marca um grupo de UCs livres e, no segundo acionamento, desmarca só esse grupo', () => {
    const { result } = renderHook(() => useQueueSelection(QUEUE))
    act(() => result.current.toggle('UC6'))

    act(() => result.current.toggleMany(['UC2', 'UC3']))
    expect(result.current.selectedIds).toEqual(['UC2', 'UC3', 'UC6'])

    act(() => result.current.toggleMany(['UC2', 'UC3']))
    expect(result.current.selectedIds).toEqual(['UC6'])
  })

  it('completa o grupo quando só parte dele está marcada', () => {
    const { result } = renderHook(() => useQueueSelection(QUEUE))
    act(() => result.current.toggle('UC2'))

    act(() => result.current.toggleMany(['UC2', 'UC3']))

    expect(result.current.selectedIds).toEqual(['UC2', 'UC3'])
  })

  it('ignora UCs com ordem gerada ou em campo ao marcar um grupo', () => {
    const { result } = renderHook(() => useQueueSelection(QUEUE))

    act(() => result.current.toggleMany(['UC1', 'UC2', 'UC4']))

    expect(result.current.selectedIds).toEqual(['UC2'])
  })

  it('descarta da seleção as UCs que saíram da lista depois de um filtro', () => {
    const { result, rerender } = renderHook(({ units }) => useQueueSelection(units), {
      initialProps: { units: QUEUE }
    })
    act(() => result.current.toggleMany(['UC2', 'UC3', 'UC5', 'UC6']))

    rerender({ units: [QUEUE[1], QUEUE[2]] })

    expect(result.current.selectedIds).toEqual(['UC2', 'UC3'])
  })

  it('devolve a marcação das UCs que voltam à lista quando o filtro é removido', () => {
    const { result, rerender } = renderHook(({ units }) => useQueueSelection(units), {
      initialProps: { units: QUEUE }
    })
    act(() => result.current.toggleMany(['UC2', 'UC3', 'UC5', 'UC6']))
    rerender({ units: [QUEUE[1]] })
    expect(result.current.selectedIds).toEqual(['UC2'])

    rerender({ units: QUEUE })

    expect(result.current.selectedIds).toEqual(['UC2', 'UC3', 'UC5', 'UC6'])
  })

  it('limpa a seleção', () => {
    const { result } = renderHook(() => useQueueSelection(QUEUE))
    act(() => result.current.toggleMany(['UC2', 'UC3', 'UC5', 'UC6']))

    act(() => result.current.clear())

    expect(result.current.selectedIds).toEqual([])
  })
})
