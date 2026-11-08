import { useEffect, useState } from 'react'

/**
 * Atrasa a adoção de um valor que muda a cada tecla, para que só o valor em que o usuário parou dispare uma consulta.
 *
 * @param value - Valor que muda rápido, como o texto de um campo.
 * @param delayMs - Pausa, em milissegundos, sem mudanças antes de adotar o novo valor.
 * @returns O valor inicial e, depois de cada pausa, o valor mais recente.
 */
export function useDebouncedValue<Value>(value: Value, delayMs: number): Value {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])

  return debouncedValue
}
