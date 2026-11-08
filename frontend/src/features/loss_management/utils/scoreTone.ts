const SCORE_HIGH = 85
const SCORE_MEDIUM = 65

/**
 * Cor da barra de score pela faixa de prioridade: alta (85 ou mais), média (65 a 84) e baixa.
 *
 * @param score - Score de 0 a 100.
 * @returns Classe de fundo da barra.
 */
export function scoreBarColor(score: number): string {
  if (score >= SCORE_HIGH) return 'bg-destructive'
  if (score >= SCORE_MEDIUM) return 'bg-warning'
  return 'bg-muted-foreground'
}
