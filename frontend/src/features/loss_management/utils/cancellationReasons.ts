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

/** Dias que a UC fica fora da fila depois de um cancelamento que torna inútil uma nova visita (espelha o backend). */
export const QUEUE_BLOCK_DAYS = 90

const QUEUE_BLOCKING_REASONS: readonly CancellationReason[] = ['cliente_regularizou', 'endereco_nao_localizado']

/**
 * Diz o que acontece com a UC na fila depois do cancelamento, conforme o motivo.
 *
 * @param reason - Motivo escolhido no diálogo.
 * @param idUc - UC da ordem cancelada.
 * @returns Frase para o diálogo de cancelamento.
 */
export function describeQueueEffect(reason: CancellationReason, idUc: string): string {
  if (QUEUE_BLOCKING_REASONS.includes(reason)) return `A UC ${idUc} fica fora da fila por ${QUEUE_BLOCK_DAYS} dias.`
  return `A UC ${idUc} volta para a fila e o score é recalculado no próximo processamento.`
}

/**
 * Texto do motivo de cancelamento para o cartão e a lista.
 *
 * @param reason - Motivo gravado na ordem.
 * @returns Rótulo em pt-BR.
 */
export function describeCancellationReason(reason: CancellationReason): string {
  return CANCELLATION_REASON_LABELS[reason]
}
