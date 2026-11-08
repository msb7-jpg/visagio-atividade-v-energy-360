import { formatIsoDate } from '@/features/loss_management/utils/unitDetailFormat'

const EMPTY_VALUE = '—'
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const HAS_TIME_ZONE = /(?:[zZ]|[+-]\d{2}:\d{2})$/
const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'America/Sao_Paulo'
})
const numberFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 })

export const EVENT_LABELS: Record<string, string> = {
  gerada: 'Ordem gerada',
  em_campo: 'Enviada a campo',
  concluida: 'Resultado registrado',
  cancelada: 'Ordem cancelada',
  resultado_importado: 'Resultado importado da planilha',
  atualizada: 'Dados atualizados'
}

const FIELD_LABELS: Record<string, string> = {
  status: 'Status',
  inspetor: 'Inspetor',
  data_inspecao: 'Data da inspeção',
  irregularidade_constatada: 'Irregularidade constatada',
  tipo_irregularidade: 'Tipo de irregularidade',
  kwh_recuperado: 'Energia recuperada (kWh)',
  numero_toi: 'Número do TOI',
  motivo_cancelamento: 'Motivo do cancelamento',
  justificativa_cancelamento: 'Justificativa do cancelamento'
}

/**
 * Data e hora do evento no fuso de Brasília.
 *
 * @param isoDateTime - Instante em ISO 8601 (o servidor grava em UTC).
 * @returns Texto como "06/11/2026 12:00".
 */
export function formatEventDate(isoDateTime: string): string {
  const instant = HAS_TIME_ZONE.test(isoDateTime) ? isoDateTime : `${isoDateTime}Z`
  return dateTimeFormatter.format(new Date(instant)).replace(', ', ' ')
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return EMPTY_VALUE
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não'
  if (typeof value === 'number') return numberFormatter.format(value)
  if (typeof value === 'string' && ISO_DATE.test(value)) return formatIsoDate(value)
  return String(value)
}

/**
 * Uma mudança de campo como "Campo: antes → depois".
 *
 * @param field - Nome do campo na API.
 * @param values - Par [valor antes, valor depois] gravado na trilha.
 * @returns Texto em pt-BR, com travessão para valor vazio.
 */
export function describeChange(field: string, values: [unknown, unknown]): string {
  const label = FIELD_LABELS[field] ?? field
  return `${label}: ${formatValue(values[0])} → ${formatValue(values[1])}`
}
