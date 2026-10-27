import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { AsyncState } from '@/components/feedback/AsyncState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { FeederHistorySheet } from '@/features/grid_quality/components/FeederHistorySheet'
import { FeederRankingTable } from '@/features/grid_quality/components/FeederRankingTable'
import { QualityKpiCards } from '@/features/grid_quality/components/QualityKpiCards'
import { useGridQualityController } from '@/features/grid_quality/hooks/useGridQualityController'
import type { QualityStatus } from '@/features/grid_quality/types/qualityTypes'

const STATUS_FILTERS: { value: QualityStatus | ''; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'violacao', label: 'Somente acima do limite de referência' },
  { value: 'alerta', label: 'Em alerta' },
  { value: 'conforme', label: 'Conformes' }
]

/**
 * Visão atual da Qualidade da Rede: DEC e FEC consolidados e ranking de alimentadores.
 *
 * @returns Cards de indicadores, filtro de status, ranking e gaveta do histórico.
 */
export function CurrentQualityView() {
  const { status, setStatus, selectedFeederId, openFeeder, closeFeeder, indicators, feeders, history } =
    useGridQualityController()
  const rankedFeeders = feeders.data ?? []

  return (
    <div className="flex flex-col gap-6">
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

      <AsyncState
        isLoading={feeders.isLoading}
        isError={feeders.isError}
        isEmpty={rankedFeeders.length === 0}
        errorTitle="Não foi possível carregar os alimentadores"
        emptyTitle="Nenhum alimentador neste filtro"
        emptyIcon={<CheckCircle2 className="size-10" />}
      >
        <FeederRankingTable feeders={rankedFeeders} onSelect={openFeeder} />
      </AsyncState>

      <FeederHistorySheet
        feederId={selectedFeederId}
        history={history.data}
        isLoading={history.isLoading}
        isError={history.isError}
        onClose={closeFeeder}
      />
    </div>
  )
}
