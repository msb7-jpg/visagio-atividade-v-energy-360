/**
 * Mínimo de ordens concluídas para a taxa de acerto real ter significado. Com 30 ordens e acerto perto de 90%, a margem
 * de erro ainda é de uns 10 pontos percentuais; com menos, uma ordem a mais muda o resultado.
 */
export const MIN_FIELD_SAMPLE = 30

/**
 * Aviso de amostra pequena para os resultados reais de campo.
 *
 * @param completedCount - Ordens concluídas no portal.
 * @returns O texto do aviso quando há de uma ordem concluída até uma a menos que o mínimo; nulo sem nenhuma ordem
 * concluída (a tela já diz que não há) ou com o mínimo atingido.
 */
export function fieldSampleWarning(completedCount: number): string | null {
  if (completedCount === 0 || completedCount >= MIN_FIELD_SAMPLE) return null
  const orders = completedCount === 1 ? '1 ordem concluída' : `${completedCount} ordens concluídas`
  return `Só ${orders}: com menos de ${MIN_FIELD_SAMPLE}, a taxa de acerto real ainda não tem significado e muda muito com uma ordem a mais.`
}
