import type { SuspiciousUnit } from '@/features/loss_management/types/lossTypes'
import type { ReturnCurve } from '@/features/loss_management/types/queueCurveTypes'
import { formatCurrency } from '@/features/loss_management/utils/lossFormatters'
import { parseKwh } from '@/features/loss_management/utils/resultFormValidation'

const POSITIVE_INTEGER = /^\d+$/

/**
 * Lê o custo por inspeção digitado em pt-BR ("150", "150,50", "1.240").
 *
 * @param costText - Texto do campo de custo.
 * @returns O custo em R$, ou nulo quando o campo está vazio ou inválido (a tela fica sem corte sugerido).
 */
export function parseCostInput(costText: string): number | null {
  if (costText.trim() === '') return null
  const cost = parseKwh(costText)
  return Number.isNaN(cost) || cost < 0 ? null : cost
}

/**
 * Lê o "quantas inspecionar" digitado.
 *
 * @param countText - Texto do campo.
 * @returns O inteiro a partir de 1, ou nulo quando o texto não é um inteiro positivo.
 */
export function parsePositiveInt(countText: string): number | null {
  const trimmedText = countText.trim()
  const count = POSITIVE_INTEGER.test(trimmedText) ? Number(trimmedText) : 0
  return count >= 1 ? count : null
}

/**
 * Escolhe as `count` primeiras UCs livres (sem ordem ativa) da fila, na ordem de prioridade.
 *
 * @param units - UCs da fila já carregadas, em ordem de prioridade.
 * @param count - Quantas marcar.
 * @returns Identificadores das UCs a marcar.
 */
export function firstFreeUnitIds(units: SuspiciousUnit[], count: number): string[] {
  return units
    .filter((unit) => unit.situacao === 'na_fila')
    .slice(0, count)
    .map((unit) => unit.id_uc)
}

/**
 * Retorno esperado, em R$/ano, de todas as UCs livres da curva.
 *
 * @param curve - Curva devolvida pelo servidor.
 * @returns O valor acumulado do último ponto; zero quando não há UC livre.
 */
export function totalExpectedReturn(curve: ReturnCurve): number {
  return curve.pontos.at(-1)?.valor_ano_acumulado_rs ?? 0
}

/**
 * Frase que diz onde parar de inspecionar, a partir do corte sugerido pelo servidor.
 *
 * @param curve - Curva devolvida pelo servidor para o custo informado.
 * @returns O texto do corte, ou o pedido do custo quando ele não foi informado.
 */
export function describeCut(curve: ReturnCurve): string {
  if (curve.total_ucs === 0) return 'Nenhuma UC livre na fila.'
  if (curve.corte_sugerido === null || curve.custo_inspecao_rs === null) {
    return 'Informe o custo de uma inspeção para ver onde parar.'
  }
  if (curve.corte_sugerido === 0) {
    return 'Com esse custo, nenhuma inspeção se paga: a primeira UC já rende menos do que a visita custa.'
  }
  const cost = formatCurrency(curve.custo_inspecao_rs)
  const which = curve.corte_sugerido === 1 ? 'a primeira UC' : `as ${curve.corte_sugerido} primeiras UCs`
  return `Com custo de ${cost} por inspeção, vale inspecionar ${which} de ${curve.total_ucs}.`
}
