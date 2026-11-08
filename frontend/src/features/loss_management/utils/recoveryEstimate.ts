// Espelha `JANELA_RECUPERACAO_MESES` de `backend/app/features/loss_management/scoring.py`: a mediana de meses de déficit
// (relativo aos pares) que o campo recuperou em 849 inspeções com irregularidade, ago-dez/2025. Ver D7 e D16 em
// `docs/DECISOES_PERDAS.md`.
const RECOVERY_MONTHS = 10
// Primeiro e terceiro quartis dessa medida: metade das inspeções recuperou entre esses dois valores, em meses de déficit.
const RECOVERY_QUARTILES_MONTHS = [7.6, 12.9] as const

const monthsFormatter = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

/**
 * Nota do valor recuperável: ele é uma estimativa, calibrada pelo que o campo recuperou.
 *
 * @returns Texto como "Estimativa de 10 meses de déficit, a mediana recuperada em campo (metade das inspeções, de 7,6 a 12,9 meses)".
 */
export function formatRecoveryNote(): string {
  const [firstQuartile, thirdQuartile] = RECOVERY_QUARTILES_MONTHS
  return `Estimativa de ${RECOVERY_MONTHS} meses de déficit, a mediana recuperada em campo (metade das inspeções, de ${monthsFormatter.format(firstQuartile)} a ${monthsFormatter.format(thirdQuartile)} meses)`
}
