import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getStoredTheme, setTheme, subscribeTheme, THEME_KEY } from '@/lib/theme'

describe('theme', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.className = 'dark'
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('usa o escuro quando nada foi salvo', () => {
    expect(getStoredTheme()).toBe('dark')
  })

  it('usa o escuro quando o valor salvo é desconhecido', () => {
    localStorage.setItem(THEME_KEY, 'sistema')

    expect(getStoredTheme()).toBe('dark')
  })

  it('usa o escuro quando o armazenamento está indisponível', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('bloqueado')
    })

    expect(getStoredTheme()).toBe('dark')
  })

  it('grava em grid360.tema, aplica a classe e avisa quem ouve', () => {
    const onChange = vi.fn()
    const unsubscribe = subscribeTheme(onChange)

    setTheme('light')

    expect(localStorage.getItem('grid360.tema')).toBe('light')
    expect(document.documentElement).not.toHaveClass('dark')
    expect(getStoredTheme()).toBe('light')
    expect(onChange).toHaveBeenCalledTimes(1)

    setTheme('dark')

    expect(document.documentElement).toHaveClass('dark')
    unsubscribe()
  })

  it('pula a transição de cores com prefers-reduced-motion', () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true })

    setTheme('light')

    expect(document.documentElement).not.toHaveClass('theme-transition')
  })
})
