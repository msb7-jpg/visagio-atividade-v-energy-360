import { CheckCircle2 } from 'lucide-react'
import { AsyncState } from '@/components/feedback/AsyncState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { Label } from '@/components/ui/label'
import { Pagination } from '@/components/ui/pagination'
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
  const { status, setStatus, pagination, selectedFeederId, openFeeder, closeFeeder, indicators, feeders, history, customers } =
    useGridQualityController()

  return (
    <div className="flex flex-col gap-6">
      {indicators.data ? <QualityKpiCards indicators={indicators.data} /> : null}
      {indicators.isError ? (
        <ErrorState title="Não foi possível carregar os indicadores" onRetry={() => void indicators.refetch()} />
      ) : null}

      <div className="flex max-w-sm flex-col gap-1.5">
        <Label htmlFor="filtro-status">Situação em relação ao limite de referência</Label>
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
        isEmpty={pagination.total === 0}
        errorTitle="Não foi possível carregar os alimentadores"
        onRetry={() => void feeders.refetch()}
        emptyTitle="Nenhum alimentador neste filtro"
        emptyIcon={<CheckCircle2 className="size-10" />}
      >
        <div className="flex flex-col gap-4">
          <FeederRankingTable feeders={pagination.items} onSelect={openFeeder} />
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={pagination.setPage}
            summary={`${pagination.total} circuitos`}
            label="Paginação dos circuitos"
          />
        </div>
      </AsyncState>

      <FeederHistorySheet
        feederId={selectedFeederId}
        history={history.data}
        isLoading={history.isLoading}
        isError={history.isError}
        customers={customers.data}
        isCustomersLoading={customers.isLoading}
        isCustomersError={customers.isError}
        onRetryHistory={() => void history.refetch()}
        onRetryCustomers={() => void customers.refetch()}
        onClose={closeFeeder}
      />
    </div>
  )
}
