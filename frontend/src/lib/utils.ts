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
