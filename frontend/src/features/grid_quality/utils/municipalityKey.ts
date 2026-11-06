/**
 * Chave do município no mapa da RMR: caixa alta e sem acento, como os contornos do IBGE ("Ilha de Itamaracá" vira
 * "ILHA DE ITAMARACA").
 *
 * @param name - Nome do município como chega da API.
 * @returns Nome normalizado.
 */
export function municipalityKey(name: string): string {
  return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase()
}
