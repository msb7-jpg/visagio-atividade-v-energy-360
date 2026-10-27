const ACCENTED_LABELS: Record<string, string> = {
  CLIMATICA: 'Climática',
  VEGETACAO: 'Vegetação',
  OSCILACAO: 'Oscilação',
  'NAO IDENTIFICADA': 'Não identificada',
  'NAO INFORMADA': 'Não informada'
}

/**
 * Rótulo legível de um código em caixa alta da Gold (tipo e causa de interrupção, tipo de irregularidade).
 *
 * @param code - Código vindo da API, ex: 'FALTA DE ENERGIA' ou 'VEGETACAO'.
 * @returns Texto como "Falta de energia" ou "Vegetação"; "Não informado" quando vazio.
 */
export function formatGoldCode(code: string | null): string {
  if (!code) {
    return 'Não informado'
  }
  const lowerCase = code.toLowerCase()
  return ACCENTED_LABELS[code] ?? `${lowerCase.charAt(0).toUpperCase()}${lowerCase.slice(1)}`
}
