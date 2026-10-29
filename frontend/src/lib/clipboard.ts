import { useCallback, useState } from 'react'

/**
 * Hook headless simples para cópia de texto para a área de transferência do navegador.
 *
 * @returns Tupla contendo o estado booleano de copiado e a função para disparar a cópia.
 */
export function useCopyToClipboard(): [boolean, (text: string) => Promise<boolean>] {
  const [isCopied, setIsCopied] = useState(false)

  const copy = useCallback(async (text: string): Promise<boolean> => {
    if (!navigator?.clipboard) {
      return false
    }

    try {
      await navigator.clipboard.writeText(text)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
      return true
    } catch {
      setIsCopied(false)
      return false
    }
  }, [])

  return [isCopied, copy]
}
