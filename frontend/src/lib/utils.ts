import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Utilitário canônico para mesclagem de classes CSS condicionais e Tailwind Merge.
 *
 * @param inputs - Lista de classes condicionais ou expressões do clsx.
 * @returns String de classes consolidadas sem conflitos de especificidade.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Utilitário para acionamento de clique acessível via teclado (Enter ou Espaço).
 *
 * @param event - Evento de teclado do React.
 * @param callback - Função a ser invocada ao pressionar Enter ou Espaço.
 */
export function handleKeyboardClick(
  event: React.KeyboardEvent,
  callback: () => void
): void {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    callback()
  }
}
