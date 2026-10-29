import type { CancellationReason } from '@/features/loss_management/types/lossTypes'

/**
 * Rótulos em pt-BR da lista fechada de motivos de cancelamento. O `Record` obriga a ter um texto para cada
 * valor de `CancellationReason`: se a API ganhar um motivo novo, o tipo deixa de compilar até o rótulo existir.
 */
export const CANCELLATION_REASON_LABELS: Record<CancellationReason, string> = {
  cliente_regularizou: 'UC regularizada pelo cliente',
  ordem_duplicada: 'Ordem duplicada',
  endereco_nao_localizado: 'Endereço não localizado ou acesso negado',
  repriorizacao_equipe: 'Repriorização da equipe',
  outro: 'Outro'
}

/** Motivos na ordem de exibição da lista. */
export const CANCELLATION_REASONS = Object.keys(CANCELLATION_REASON_LABELS) as CancellationReason[]

/**
 * Texto do motivo de cancelamento para o cartão e a lista.
 *
 * @param reason - Motivo gravado na ordem.
 * @returns Rótulo em pt-BR.
 */
export function describeCancellationReason(reason: CancellationReason): string {
  return CANCELLATION_REASON_LABELS[reason]
}
