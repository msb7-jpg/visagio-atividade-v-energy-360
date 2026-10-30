import { useSyncExternalStore } from 'react'

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

function subscribe(onChange: () => void) {
  if (typeof window.matchMedia !== 'function') return () => undefined
  const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY)
  mediaQuery.addEventListener('change', onChange)
  return () => mediaQuery.removeEventListener('change', onChange)
}

function getSnapshot() {
  return typeof window.matchMedia === 'function' && window.matchMedia(REDUCED_MOTION_QUERY).matches
}

/**
 * Acompanha a preferência `prefers-reduced-motion: reduce` do sistema.
 *
 * @returns `true` quando o usuário pediu menos movimento.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}
