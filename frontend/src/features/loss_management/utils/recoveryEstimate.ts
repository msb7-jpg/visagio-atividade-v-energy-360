/**
 * Quanto o campo recuperou em relação ao estimado (mediana de 188 ordens irregulares da competência 2025-08):
 * a estimativa de 3 meses de déficit é conservadora. Ver D7 em `docs/DECISOES_PERDAS.md`.
 */
const OBSERVED_RECOVERY_RATIO = 1.87
// Espelha `JANELA_RECUPERACAO_MESES` de `backend/app/features/loss_management/scoring.py`.
const RECOVERY_MONTHS = 3

const ratioFormatter = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/**
 * Nota do valor recuperável: ele é uma estimativa, e o campo costuma recuperar mais.
 *
 * @returns Texto como "Estimativa de 3 meses de déficit: em campo, o recuperado foi 1,87× o estimado (mediana)".
 */
export function formatRecoveryNote(): string {
  return `Estimativa de ${RECOVERY_MONTHS} meses de déficit: em campo, o recuperado foi ${ratioFormatter.format(OBSERVED_RECOVERY_RATIO)}× o estimado (mediana)`
}
