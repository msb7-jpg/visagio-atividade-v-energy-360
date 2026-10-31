import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import indexHtml from '../../../index.html?raw'
import { getStoredTheme, setTheme, subscribeTheme, THEME_KEY } from '@/lib/theme'

/** Executa o script inline do `<head>` (o que roda antes da primeira pintura) contra o `<html>` atual. */
function runHeadScript() {
  const script = /<script>([\s\S]*?)<\/script>/.exec(indexHtml)?.[1] ?? ''
  // O teste executa de propósito o script do nosso próprio index.html, para provar que ele roda antes da pintura.
  // eslint-disable-next-line sonarjs/code-eval
  new Function(script)()
}

describe('theme', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.className = 'dark'
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('usa o escuro quando nada foi salvo', () => {
    expect(getStoredTheme()).toBe('escuro')
  })

  it('usa o escuro quando o valor salvo é desconhecido', () => {
    localStorage.setItem(THEME_KEY, 'sistema')

    expect(getStoredTheme()).toBe('escuro')
  })

  it('reconhece o valor antigo `light` como claro', () => {
    localStorage.setItem(THEME_KEY, 'light')

    expect(getStoredTheme()).toBe('claro')
  })

  it('usa o escuro quando o armazenamento está indisponível para leitura', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('bloqueado')
    })

    expect(getStoredTheme()).toBe('escuro')
  })

  it('aplica o tema mesmo quando o armazenamento está indisponível para gravação', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('bloqueado')
    })
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    setTheme('claro')

    expect(document.documentElement).not.toHaveClass('dark')
  })

  it('grava claro/escuro em grid360.tema, aplica a classe e avisa quem ouve', () => {
    const onChange = vi.fn()
    const unsubscribe = subscribeTheme(onChange)

    setTheme('claro')

    expect(localStorage.getItem('grid360.tema')).toBe('claro')
    expect(document.documentElement).not.toHaveClass('dark')
    expect(getStoredTheme()).toBe('claro')
    expect(onChange).toHaveBeenCalledTimes(1)

    setTheme('escuro')

    expect(localStorage.getItem('grid360.tema')).toBe('escuro')
    expect(document.documentElement).toHaveClass('dark')
    unsubscribe()
  })

  it('pula a transição de cores com prefers-reduced-motion', () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true })

    setTheme('claro')

    expect(document.documentElement).not.toHaveClass('theme-transition')
  })

  describe('script do <head> (sem piscar ao recarregar)', () => {
    it('recarregar no claro não deixa a classe dark', () => {
      localStorage.setItem(THEME_KEY, 'claro')

      runHeadScript()

      expect(document.documentElement).not.toHaveClass('dark')
    })

    it('sem escolha, ou com valor desconhecido, fica no escuro', () => {
      document.documentElement.className = ''
      runHeadScript()
      expect(document.documentElement).toHaveClass('dark')

      localStorage.setItem(THEME_KEY, 'sistema')
      document.documentElement.className = ''
      runHeadScript()
      expect(document.documentElement).toHaveClass('dark')
    })

    it('com o armazenamento bloqueado, fica no escuro', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('bloqueado')
      })
      document.documentElement.className = ''

      runHeadScript()

      expect(document.documentElement).toHaveClass('dark')
    })
  })
})
