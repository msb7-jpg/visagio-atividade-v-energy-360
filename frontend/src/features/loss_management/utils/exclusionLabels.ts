import type { ExcludedUnit, ExclusionReason } from '@/features/loss_management/types/excludedTypes'
import { formatIsoDate } from '@/features/loss_management/utils/unitDetailFormat'

export const EXCLUSION_LABELS: Record<ExclusionReason, string> = {
  possui_gd: 'Possui geração distribuída',
  inspecionada_sem_achado: 'Inspecionada sem achado',
  irregularidade_recente: 'Irregularidade recente',
  cancelamento_bloqueante: 'Ordem cancelada'
}

export const EXCLUSION_HINTS: Record<ExclusionReason, string> = {
  possui_gd: 'A queda de consumo vem da geração própria; não há prazo para voltar.',
  inspecionada_sem_achado: 'Inspeção na janela de análise (15 meses) sem irregularidade.',
  irregularidade_recente: 'Irregularidade constatada há menos de 12 meses; volta antes só com nova queda súbita.',
  cancelamento_bloqueante: 'Cancelada por cliente regularizado ou endereço não localizado; fora por 90 dias.'
}

const EMPTY_VALUE = '—'

/**
 * Texto da coluna "Detalhe": a data do evento que causou a exclusão, ou a explicação da regra.
 *
 * @param unit - UC excluída da fila.
 * @returns Detalhe curto em pt-BR.
 */
export function describeExclusion(unit: ExcludedUnit): string {
  if (unit.data_evento === null) return EXCLUSION_HINTS[unit.motivo_exclusao]
  const eventLabel = {
    possui_gd: '',
    inspecionada_sem_achado: 'Inspeção em',
    irregularidade_recente: 'Irregularidade constatada em',
    cancelamento_bloqueante: 'Ordem cancelada em'
  }[unit.motivo_exclusao]
  return `${eventLabel} ${formatIsoDate(unit.data_evento)}`
}

/**
 * Data a partir da qual a UC pode voltar à fila; só existe quando há regra de prazo.
 *
 * @param unit - UC excluída da fila.
 * @returns Data dd/mm/aaaa ou travessão quando não há regra (GD).
 */
export function formatReturnDate(unit: ExcludedUnit): string {
  return unit.volta_a_ser_avaliada === null ? EMPTY_VALUE : formatIsoDate(unit.volta_a_ser_avaliada)
}
