import { AsyncState } from '@/components/feedback/AsyncState'
import { CauseSharesCard } from '@/features/grid_quality/components/CauseSharesCard'
import { TypeSharesCard } from '@/features/grid_quality/components/TypeSharesCard'
import { ContinuityEventCard } from '@/features/grid_quality/components/ContinuityEventCard'
import { ContinuityFeedersCard } from '@/features/grid_quality/components/ContinuityFeedersCard'
import { ContinuityFilters } from '@/features/grid_quality/components/ContinuityFilters'
import { ContinuityKpiCards } from '@/features/grid_quality/components/ContinuityKpiCards'
import { ContinuityMapCard } from '@/features/grid_quality/components/ContinuityMapCard'
import { useContinuityController } from '@/features/grid_quality/hooks/useContinuityController'
import { buildPeriodLabels } from '@/features/grid_quality/utils/periodLabels'

/**
 * Aba "Continuidade": últimos 12 meses (período B) contra os primeiros 12 (período A), com as datas na tela.
 *
 * @returns Filtros e blocos da tela.
 */
export function ContinuityView() {
  const {
    includeEventMonth,
    setIncludeEventMonth,
    municipality,
    setMunicipality,
    municipalityNames,
    cause,
    setCause,
    causeOptions,
    snapshot
  } = useContinuityController()
  const periods = snapshot.data ? buildPeriodLabels(snapshot.data.periods) : null

  return (
    <div className="flex flex-col gap-6">
      <p className="text-muted-foreground text-sm">
        DEC e FEC simplificados servem para comparar alimentadores e períodos entre si, não para medir violação regulatória.
      </p>

      <ContinuityFilters
        includeEventMonth={includeEventMonth}
        onIncludeEventMonthChange={setIncludeEventMonth}
        municipality={municipality}
        onMunicipalityChange={setMunicipality}
        municipalityNames={municipalityNames}
        cause={cause}
        onCauseChange={setCause}
        causeOptions={causeOptions}
        eventCompetencia={snapshot.data?.event?.competencia}
      />

      <AsyncState
        isLoading={snapshot.isLoading}
        isError={snapshot.isError}
        errorTitle="Não foi possível carregar a Continuidade"
        onRetry={() => void snapshot.refetch()}
      >
        {snapshot.data && periods ? (
          <div className="flex flex-col gap-6">
            <p className="text-foreground text-sm font-semibold">
              Últimos 12 meses ({periods.current}) comparados com os primeiros 12 meses da base ({periods.previous}).
            </p>
            <ContinuityKpiCards kpis={snapshot.data.kpis} periods={periods} />
            {snapshot.data.event ? <ContinuityEventCard event={snapshot.data.event} cause={cause} periods={periods} /> : null}
            <ContinuityMapCard municipalities={snapshot.data.municipalities} periods={periods} />
            <ContinuityFeedersCard feeders={snapshot.data.feeders} periods={periods} />
            <div className="grid gap-6 lg:grid-cols-2">
              <CauseSharesCard causes={snapshot.data.causes} periods={periods} />
              <TypeSharesCard types={snapshot.data.types} periods={periods} />
            </div>
          </div>
        ) : null}
      </AsyncState>
    </div>
  )
}
