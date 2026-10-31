import { useSyncExternalStore } from 'react'
import { getStoredTheme, setTheme, subscribeTheme, type Theme } from '@/lib/theme'

/**
 * Tema atual do portal e a função que o troca (salva em `grid360.tema` e aplica na hora).
 *
 * @returns Tema atual e `toggleTheme`, que alterna entre escuro e claro.
 */
export function useTheme(): { theme: Theme; toggleTheme: () => void } {
  const theme = useSyncExternalStore(subscribeTheme, getStoredTheme, () => 'dark' as const)

  return { theme, toggleTheme: () => setTheme(theme === 'dark' ? 'light' : 'dark') }
}
