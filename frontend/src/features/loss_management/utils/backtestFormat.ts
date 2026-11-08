import { formatIsoDate } from '@/features/loss_management/utils/unitDetailFormat'

const EMPTY_VALUE = '—'
const KWH_PER_MWH = 1000
const pointsFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1, signDisplay: 'exceptZero' })
const mwhFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })

/**
 * Diferença em pontos percentuais, com sinal.
 *
 * @param points - Diferença já em pontos (ex.: 29,3), ou nulo se não pode ser calculada.
 * @returns Texto como "+29,3 p.p." ou travessão.
 */
export function formatPoints(points: number | null): string {
  return points === null ? EMPTY_VALUE : `${pointsFormatter.format(points)} p.p.`
}

/**
 * Energia em MWh, no padrão brasileiro.
 *
 * @param kwh - Energia em kWh.
 * @returns Texto como "463,0 MWh".
 */
export function formatMwh(kwh: number): string {
  return `${mwhFormatter.format(kwh / KWH_PER_MWH)} MWh`
}

/**
 * Competência 'AAAA-MM' como "mm/aaaa".
 *
 * @param competencia - Competência no formato 'AAAA-MM'.
 * @returns Texto como "07/2025".
 */
export function formatCompetencia(competencia: string): string {
  const [year, month] = competencia.split('-')
  return `${month}/${year}`
}

/**
 * Janela em que o resultado foi medido.
 *
 * @param start - Primeiro dia (ISO).
 * @param end - Último dia (ISO).
 * @returns Texto como "01/08/2025 a 31/10/2025".
 */
export function formatWindow(start: string, end: string): string {
  return `${formatIsoDate(start)} a ${formatIsoDate(end)}`
}
