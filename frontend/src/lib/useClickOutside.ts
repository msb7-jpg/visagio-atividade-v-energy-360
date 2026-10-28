import { useEffect, type RefObject } from 'react'

/**
 * Hook headless que dispara um callback quando o usuário clica fora do elemento referenciado.
 *
 * @param ref - Referência React do elemento DOM a ser monitorado.
 * @param handler - Função de callback executada quando ocorrer clique externo.
 */
export function useClickOutside<T extends HTMLElement>(
  ref: RefObject<T | null>,
  handler: (event: MouseEvent | TouchEvent) => void
): void {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      const el = ref.current
      if (!el || el.contains(event.target as Node)) {
        return
      }
      handler(event)
    }

    document.addEventListener('mousedown', listener)
    document.addEventListener('touchstart', listener)

    return () => {
      document.removeEventListener('mousedown', listener)
      document.removeEventListener('touchstart', listener)
    }
  }, [ref, handler])
}
