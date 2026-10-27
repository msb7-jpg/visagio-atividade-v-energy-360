import type {
  ContinuityDataset,
  MunicipalityRef,
  NetworkOccurrenceRow,
  QualityFeederRow
} from '@/features/grid_quality/types/continuityTypes'

// DADOS DE EXEMPLO: valores inventados, só no formato das colunas reais de `fato_qualidade_alimentador`
// e `fato_ocorrencias_rede`. Substituir por API quando a Gold da Fatia 02 entrar na main.

const MUNICIPALITIES: MunicipalityRef[] = [
  { code: 'REC', name: 'Recife', latitude: -8.05, longitude: -34.9 },
  { code: 'SAO', name: 'São Lourenço da Mata', latitude: -8.0, longitude: -35.02 },
  { code: 'JAB', name: 'Jaboatão dos Guararapes', latitude: -8.11, longitude: -35.01 },
  { code: 'OLI', name: 'Olinda', latitude: -8.01, longitude: -34.85 },
  { code: 'CAB', name: 'Cabo de Santo Agostinho', latitude: -8.29, longitude: -35.03 }
]

const PERIOD_A = ['2023-01', '2023-02', '2023-03', '2023-04']
const PERIOD_B = ['2025-07', '2025-08', '2025-09', '2025-10']
const EVENT_COMPETENCIA = '2025-07'
// Peso de cada mês no total do período: o mês do evento concentra a piora.
const MONTH_WEIGHT: Record<string, number> = { '2025-07': 4 }

interface FeederSeed {
  id: string
  ucs: number
  decB: number
  decA: number
  fecB: number
  fecA: number
}

const FEEDERS: FeederSeed[] = [
  { id: 'ALM-REC-008', ucs: 2000, decB: 12, decA: 0.5, fecB: 3, fecA: 0.8 },
  { id: 'ALM-SAO-004', ucs: 1000, decB: 10, decA: 0.5, fecB: 3, fecA: 0.8 },
  { id: 'ALM-JAB-004', ucs: 800, decB: 8, decA: 0.5, fecB: 2, fecA: 0.8 },
  { id: 'ALM-OLI-006', ucs: 600, decB: 2, decA: 1.5, fecB: 1, fecA: 0.8 },
  { id: 'ALM-CAB-006', ucs: 400, decB: 2, decA: 1.5, fecB: 1, fecA: 0.8 },
  { id: 'ALM-JAB-016', ucs: 20, decB: 40, decA: 1.5, fecB: 1, fecA: 0.8 }
]

function monthRows(seed: FeederSeed, months: string[], dec: number, fec: number): QualityFeederRow[] {
  const totalWeight = months.reduce((total, month) => total + (MONTH_WEIGHT[month] ?? 1), 0)
  return months.map((competencia) => {
    const share = (MONTH_WEIGHT[competencia] ?? 1) / totalWeight
    return {
      id_alimentador: seed.id,
      competencia,
      ucs_atendidas: seed.ucs,
      ucs_interrompidas: Math.round(fec * seed.ucs * share),
      dec_apurado_horas: dec * share,
      fec_apurado_vezes: fec * share
    }
  })
}

const OCCURRENCE_TYPES = ['FALTA DE ENERGIA', 'FALTA DE ENERGIA', 'FALTA DE ENERGIA', 'OSCILACAO', 'SOBRECARGA', 'FIO PARTIDO', 'DANO EM EQUIPAMENTO']
const OCCURRENCE_CAUSES = ['CLIMATICA', 'CLIMATICA', 'VEGETACAO', 'SOBRECARGA', 'TERCEIROS', 'FALHA DE EQUIPAMENTO', 'NAO IDENTIFICADA', 'NAO INFORMADA']
const ROWS_PER_MONTH = 8

function occurrenceRows(): NetworkOccurrenceRow[] {
  return FEEDERS.flatMap((seed, feederIndex) =>
    PERIOD_B.flatMap((competencia, monthIndex) =>
      Array.from({ length: ROWS_PER_MONTH }, (_, rowIndex) => {
        const order = (feederIndex * PERIOD_B.length + monthIndex) * ROWS_PER_MONTH + rowIndex
        return {
          id_ocorrencia: `EX-${order}`,
          id_uc: `UC-EX-${order}`,
          id_alimentador: seed.id,
          tipo_ocorrencia: OCCURRENCE_TYPES[order % OCCURRENCE_TYPES.length],
          causa: OCCURRENCE_CAUSES[(order * 3) % OCCURRENCE_CAUSES.length],
          inicio_interrupcao: `${competencia}-10 08:00:00`,
          duracao_horas: 1 + (order % 5) * 0.75,
          competencia
        }
      })
    )
  )
}

export const continuityDataset: ContinuityDataset = {
  quality: FEEDERS.flatMap((seed) => [
    ...monthRows(seed, PERIOD_A, seed.decA, seed.fecA),
    ...monthRows(seed, PERIOD_B, seed.decB, seed.fecB)
  ]),
  occurrences: occurrenceRows(),
  municipalities: MUNICIPALITIES,
  periodA: PERIOD_A,
  periodB: PERIOD_B,
  eventCompetencia: EVENT_COMPETENCIA
}
