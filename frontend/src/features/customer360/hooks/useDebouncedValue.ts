import { useEffect, useState } from 'react'

/**
 * Atrasa a propagação de um valor até que ele pare de mudar pelo tempo informado.
 *
 * @param value - Valor que muda a cada tecla.
 * @param delayMs - Tempo de espera sem mudanças, em milissegundos.
 * @returns O último valor estável.
 */
export function useDebouncedValue<TValue>(value: TValue, delayMs: number): TValue {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])
  return debouncedValue
}
