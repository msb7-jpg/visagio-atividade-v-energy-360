import type { InspectionStatus, SuspicionReason } from '@/features/loss_management/types/lossTypes'

const kwhFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })
const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const percentFormatter = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 1 })
const dateFormatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' })

export const REASON_LABELS: Record<SuspicionReason, string> = {
  queda_subita: 'Queda súbita',
  leitura_zerada: 'Leitura zerada'
}

export const STATUS_LABELS: Record<InspectionStatus, string> = {
  gerada: 'Gerada',
  pendente: 'Em campo',
  concluida: 'Concluída',
  cancelada: 'Cancelada'
}

/** Tipos de irregularidade registrados historicamente pelas equipes de campo. */
export const IRREGULARITY_TYPES = [
  'BY-PASS',
  'DESVIO DIRETO',
  'LACRE VIOLADO',
  'LIGACAO CLANDESTINA',
  'MEDIDOR ADULTERADO'
] as const

/**
 * Formata energia em kWh no padrão brasileiro.
 *
 * @param kwh - Energia em kWh.
 * @returns Texto como "22.426,2 kWh".
 */
export function formatKwh(kwh: number): string {
  return `${kwhFormatter.format(kwh)} kWh`
}

/**
 * Formata valor monetário em reais.
 *
 * @param value - Valor em R$.
 * @returns Texto como "R$ 19.062,27".
 */
export function formatCurrency(value: number): string {
  return currencyFormatter.format(value)
}

/**
 * Formata uma fração como porcentagem no padrão brasileiro.
 *
 * @param fraction - Valor entre 0 e 1.
 * @returns Texto como "93%" ou "62,7%".
 */
export function formatPercent(fraction: number): string {
  return percentFormatter.format(fraction)
}

/**
 * Formata data ISO para dd/mm/aaaa.
 *
 * @param isoDate - Data em ISO 8601.
 * @returns Data curta em pt-BR.
 */
export function formatDate(isoDate: string): string {
  return dateFormatter.format(new Date(isoDate))
}

/**
 * Descreve os motivos de suspeita em texto para a ordem de inspeção.
 *
 * @param reasons - Motivos calculados pelo backend.
 * @returns Motivos legíveis separados por vírgula.
 */
export function describeReasons(reasons: SuspicionReason[]): string {
  return reasons.map((reason) => REASON_LABELS[reason]).join(', ')
}
