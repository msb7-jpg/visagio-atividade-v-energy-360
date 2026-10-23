const REVOKE_DELAY_MS = 10_000

/**
 * Dispara o download de um arquivo gerado no navegador.
 *
 * @param blob - Conteúdo do arquivo.
 * @param filename - Nome sugerido para salvar.
 */
export function saveBlobAsFile(blob: Blob, filename: string): void {
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  // Revogar na hora pode cancelar o download em navegadores que leem o blob de forma assíncrona.
  setTimeout(() => URL.revokeObjectURL(objectUrl), REVOKE_DELAY_MS)
}
