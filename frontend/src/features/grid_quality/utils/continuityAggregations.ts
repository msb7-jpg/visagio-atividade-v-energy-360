import type {
  CauseShare,
  ContinuityDataset,
  ContinuityEvent,
  ContinuityFilters,
  ContinuityKpis,
  ContinuitySnapshot,
  FeederUcHours,
  MunicipalityDec,
  NetworkOccurrenceRow,
  PeriodComparison,
  QualityFeederRow,
  TypeShare
} from '@/features/grid_quality/types/continuityTypes'

// Causas que a manutenção preventiva consegue atacar; premissa da tela de referência, a validar com a Fatia 02.
const ACTIONABLE_CAUSES = new Set(['VEGETACAO', 'FALHA DE EQUIPAMENTO', 'SOBRECARGA'])
const SMALL_SAMPLE_UCS = 50

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0)

function median(values: number[]): number {
  const sorted = [...values].sort((first, second) => first - second)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle]
}

function compare(current: number, previous: number): PeriodComparison {
  const changePercent = previous === 0 ? 0 : ((current - previous) / previous) * 100
  return { current, previous, changePercent }
}

function municipalityOf(dataset: ContinuityDataset, feederId: string): string {
  const code = feederId.split('-')[1]
  return dataset.municipalities.find((municipality) => municipality.code === code)?.name ?? code
}

function feederIds(rows: QualityFeederRow[]): string[] {
  return [...new Set(rows.map((row) => row.id_alimentador))]
}

/** DEC ou FEC do conjunto de linhas, ponderado pelas UCs atendidas de cada alimentador. */
function weighted(rows: QualityFeederRow[], pick: (row: QualityFeederRow) => number): number {
  const ucsByFeeder = feederIds(rows).map((id) => rows.find((row) => row.id_alimentador === id)?.ucs_atendidas ?? 0)
  const totalUcs = sum(ucsByFeeder)
  const weightedTotal = sum(rows.map((row) => pick(row) * row.ucs_atendidas))
  return totalUcs === 0 ? 0 : weightedTotal / totalUcs
}

function buildKpis(current: QualityFeederRow[], previous: QualityFeederRow[]): ContinuityKpis {
  const interruptions = (rows: QualityFeederRow[]) => sum(rows.map((row) => row.ucs_interrompidas))
  const ucHours = (rows: QualityFeederRow[]) => sum(rows.map((row) => row.dec_apurado_horas * row.ucs_atendidas))
  const averageDuration = (rows: QualityFeederRow[]) => ucHours(rows) / Math.max(interruptions(rows), 1)
  const decOf = (row: QualityFeederRow) => row.dec_apurado_horas
  const fecOf = (row: QualityFeederRow) => row.fec_apurado_vezes
  return {
    dec: compare(weighted(current, decOf), weighted(previous, decOf)),
    fec: compare(weighted(current, fecOf), weighted(previous, fecOf)),
    interruptions: compare(interruptions(current), interruptions(previous)),
    averageDurationHours: compare(averageDuration(current), averageDuration(previous))
  }
}

function buildEvent(dataset: ContinuityDataset, rows: QualityFeederRow[]): ContinuityEvent {
  const byMonth = dataset.periodB.map((competencia) =>
    sum(rows.filter((row) => row.competencia === competencia).map((row) => row.ucs_interrompidas))
  )
  const eventIndex = dataset.periodB.indexOf(dataset.eventCompetencia)
  const withoutEvent = rows.filter((row) => row.competencia !== dataset.eventCompetencia)
  return {
    competencia: dataset.eventCompetencia,
    eventInterruptions: byMonth[eventIndex] ?? 0,
    otherMonthsMedian: median(byMonth.filter((_, index) => index !== eventIndex)),
    decWithoutEvent: weighted(withoutEvent, (row) => row.dec_apurado_horas),
    fecWithoutEvent: weighted(withoutEvent, (row) => row.fec_apurado_vezes)
  }
}

function buildMunicipalities(dataset: ContinuityDataset, rows: QualityFeederRow[]): MunicipalityDec[] {
  return dataset.municipalities
    .map((municipality) => ({
      municipality,
      own: rows.filter((row) => municipalityOf(dataset, row.id_alimentador) === municipality.name)
    }))
    .filter((entry) => entry.own.length > 0)
    .map((entry) => ({
      name: entry.municipality.name,
      latitude: entry.municipality.latitude,
      longitude: entry.municipality.longitude,
      decHours: weighted(entry.own, (row) => row.dec_apurado_horas)
    }))
    .sort((first, second) => second.decHours - first.decHours)
}

function buildFeeders(dataset: ContinuityDataset, current: QualityFeederRow[], previous: QualityFeederRow[]): FeederUcHours[] {
  const totalUcHours = sum(current.map((row) => row.dec_apurado_horas * row.ucs_atendidas))
  return feederIds(current)
    .map((id) => {
      const own = current.filter((row) => row.id_alimentador === id)
      const ucHours = sum(own.map((row) => row.dec_apurado_horas * row.ucs_atendidas))
      return {
        id_alimentador: id,
        municipality: municipalityOf(dataset, id),
        ucsServed: own[0].ucs_atendidas,
        decHours: sum(own.map((row) => row.dec_apurado_horas)),
        fecTimes: sum(own.map((row) => row.fec_apurado_vezes)),
        interruptions: sum(own.map((row) => row.ucs_interrompidas)),
        ucHours,
        networkSharePercent: totalUcHours === 0 ? 0 : (ucHours / totalUcHours) * 100,
        decPreviousHours: sum(previous.filter((row) => row.id_alimentador === id).map((row) => row.dec_apurado_horas)),
        smallSample: own[0].ucs_atendidas < SMALL_SAMPLE_UCS
      }
    })
    .sort((first, second) => second.ucHours - first.ucHours)
}

function buildCauses(rows: NetworkOccurrenceRow[]): CauseShare[] {
  const totalHours = sum(rows.map((row) => row.duracao_horas))
  return [...new Set(rows.map((row) => row.causa))]
    .map((cause) => ({
      cause,
      sharePercent: (sum(rows.filter((row) => row.causa === cause).map((row) => row.duracao_horas)) / totalHours) * 100,
      actionable: ACTIONABLE_CAUSES.has(cause)
    }))
    .sort((first, second) => second.sharePercent - first.sharePercent)
}

function buildTypes(rows: NetworkOccurrenceRow[]): TypeShare[] {
  return [...new Set(rows.map((row) => row.tipo_ocorrencia))]
    .map((type) => ({ type, sharePercent: (rows.filter((row) => row.tipo_ocorrencia === type).length / rows.length) * 100 }))
    .sort((first, second) => second.sharePercent - first.sharePercent)
}

/**
 * Monta a visão de Continuidade (B contra A) a partir das linhas cruas da Gold.
 *
 * @param dataset - Linhas de `fato_qualidade_alimentador`, `fato_ocorrencias_rede` e parâmetros dos períodos.
 * @param filters - Município e inclusão do mês do evento no período B.
 * @returns Indicadores, ranking e participações prontos para a tela.
 */
export function buildContinuitySnapshot(dataset: ContinuityDataset, filters: ContinuityFilters): ContinuitySnapshot {
  const inScope = (feederId: string) => filters.municipality === '' || municipalityOf(dataset, feederId) === filters.municipality
  const monthsB = dataset.periodB.filter((competencia) => filters.includeEventMonth || competencia !== dataset.eventCompetencia)
  const scoped = dataset.quality.filter((row) => inScope(row.id_alimentador))
  const current = scoped.filter((row) => monthsB.includes(row.competencia))
  const previous = scoped.filter((row) => dataset.periodA.includes(row.competencia))
  const occurrences = dataset.occurrences.filter((row) => inScope(row.id_alimentador) && monthsB.includes(row.competencia))
  return {
    kpis: buildKpis(current, previous),
    event: buildEvent(dataset, scoped.filter((row) => dataset.periodB.includes(row.competencia))),
    municipalities: buildMunicipalities(dataset, current),
    feeders: buildFeeders(dataset, current, previous),
    causes: buildCauses(occurrences),
    types: buildTypes(occurrences)
  }
}
