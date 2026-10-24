import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { EmptyState } from '@/components/feedback/EmptyState'
import { LoadingSkeleton } from '@/components/feedback/LoadingSkeleton'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { FeederHistorySheet } from '@/features/grid_quality/components/FeederHistorySheet'
import { FeederRankingTable } from '@/features/grid_quality/components/FeederRankingTable'
import { QualityKpiCards } from '@/features/grid_quality/components/QualityKpiCards'
import { useGridQualityController } from '@/features/grid_quality/hooks/useGridQualityController'
import type { QualityStatus } from '@/features/grid_quality/types/qualityTypes'

const STATUS_FILTERS: { value: QualityStatus | ''; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'violacao', label: 'Somente com violação do limite' },
  { value: 'alerta', label: 'Em alerta' },
  { value: 'conforme', label: 'Conformes' }
]

/**
 * Página de Qualidade da Rede: DEC e FEC consolidados e ranking de alimentadores.
 *
 * @returns Cards de indicadores, filtro de status, ranking e gaveta do histórico.
 */
export function GridQualityPage() {
  const { status, setStatus, selectedFeederId, openFeeder, closeFeeder, indicators, feeders, history } =
    useGridQualityController()
  const rankedFeeders = feeders.data ?? []

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-foreground text-xl font-bold tracking-tight">Qualidade da Rede</h1>
        <p className="text-muted-foreground text-sm">
          DEC e FEC por alimentador, dos piores para os melhores, para direcionar a manutenção preventiva.
        </p>
      </div>

      {indicators.data ? <QualityKpiCards indicators={indicators.data} /> : null}
      {indicators.isError ? (
        <EmptyState title="Não foi possível carregar os indicadores" icon={<AlertTriangle className="size-10" />} />
      ) : null}

      <div className="flex max-w-sm flex-col gap-1.5">
        <Label htmlFor="filtro-status">Status regulatório</Label>
        <Select
          id="filtro-status"
          value={status ?? ''}
          onChange={(event) => setStatus(event.target.value === '' ? undefined : (event.target.value as QualityStatus))}
        >
          {STATUS_FILTERS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </Select>
      </div>

      {feeders.isLoading ? <LoadingSkeleton count={4} className="h-8" /> : null}
      {feeders.isError ? (
        <EmptyState title="Não foi possível carregar os alimentadores" icon={<AlertTriangle className="size-10" />} />
      ) : null}
      {feeders.isSuccess && rankedFeeders.length === 0 ? (
        <EmptyState title="Nenhum alimentador neste filtro" icon={<CheckCircle2 className="size-10" />} />
      ) : null}
      {rankedFeeders.length > 0 ? <FeederRankingTable feeders={rankedFeeders} onSelect={openFeeder} /> : null}

      <FeederHistorySheet
        feederId={selectedFeederId}
        history={history.data}
        isLoading={history.isLoading}
        isError={history.isError}
        onClose={closeFeeder}
      />
    </main>
  )
}
