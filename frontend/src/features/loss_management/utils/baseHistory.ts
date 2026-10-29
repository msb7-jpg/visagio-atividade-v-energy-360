import type { SuspiciousUnit } from '@/features/loss_management/types/lossTypes'

// Espelha `MESES_BASE_MINIMO` de `backend/app/features/loss_management/hit_rate.py`: abaixo disso a UC é uma ligação
// recente e a chance de acerto medida em UCs com histórico completo não vale (docs/DECISOES_PERDAS.md D14).
const MIN_BASE_MONTHS = 11

/**
 * Avisa que a "base" da UC é curta: a queda compara três meses recentes com poucos meses de uma ligação nova.
 *
 * @param unit - UC da fila.
 * @returns Texto como "Ligação recente: base de 3 meses", ou null quando a UC tem histórico completo.
 */
export function describeShortHistory(unit: SuspiciousUnit): string | null {
  if (unit.meses_base >= MIN_BASE_MONTHS) return null
  return `Ligação recente: base de ${unit.meses_base} ${unit.meses_base === 1 ? 'mês' : 'meses'}`
}
