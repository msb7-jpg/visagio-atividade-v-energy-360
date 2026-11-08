import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useDebouncedValue } from '@/features/loss_management/hooks/useDebouncedValue'

describe('useDebouncedValue', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('começa com o valor inicial e só adota o novo depois da pausa', () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
      initialProps: { value: '1' }
    })

    rerender({ value: '15' })
    expect(result.current).toBe('1')

    act(() => vi.advanceTimersByTime(300))
    expect(result.current).toBe('15')
  })

  it('reinicia a espera a cada mudança, então digitar depressa gera um só valor', () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
      initialProps: { value: '1' }
    })

    rerender({ value: '15' })
    act(() => vi.advanceTimersByTime(200))
    rerender({ value: '150' })
    act(() => vi.advanceTimersByTime(200))
    expect(result.current).toBe('1')

    act(() => vi.advanceTimersByTime(100))
    expect(result.current).toBe('150')
  })
})
