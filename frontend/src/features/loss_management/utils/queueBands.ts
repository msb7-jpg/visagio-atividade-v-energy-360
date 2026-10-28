import type { SuspiciousUnit } from '@/features/loss_management/types/lossTypes'

/**
 * Chance de acerto a partir da qual a UC é prioritária. As taxas medidas em campo ficam bem longe deste corte:
 * 7% (queda de 20% a 30%), 42% (30% a 50%), 63% (leitura zerada) e 93% (queda abrupta).
 */
export const PRIORITY_MIN_HIT_PROBABILITY = 0.3

export interface QueueBands {
  priority: SuspiciousUnit[]
  lowChance: SuspiciousUnit[]
}

/**
 * Indica se a UC tem chance de acerto suficiente para a faixa prioritária.
 *
 * @param unit - UC da fila.
 * @returns True quando a chance de acerto atinge o corte da faixa prioritária.
 */
export function isPriorityUnit(unit: SuspiciousUnit): boolean {
  return unit.probabilidade_acerto >= PRIORITY_MIN_HIT_PROBABILITY
}

/**
 * Separa a fila em faixa prioritária e faixa de baixa chance, mantendo a ordem do backend dentro de cada uma.
 *
 * @param units - UCs da fila, já ordenadas pelo kWh esperado.
 * @returns As duas faixas; a soma delas é sempre a fila inteira.
 */
export function splitQueueBands(units: SuspiciousUnit[]): QueueBands {
  return {
    priority: units.filter(isPriorityUnit),
    lowChance: units.filter((unit) => !isPriorityUnit(unit))
  }
}
