import { AsyncState } from '@/components/feedback/AsyncState'
import { CauseSharesCard } from '@/features/grid_quality/components/CauseSharesCard'
import { TypeSharesCard } from '@/features/grid_quality/components/TypeSharesCard'
import { ContinuityEventCard } from '@/features/grid_quality/components/ContinuityEventCard'
import { ContinuityFeedersCard } from '@/features/grid_quality/components/ContinuityFeedersCard'
import { ContinuityFilters } from '@/features/grid_quality/components/ContinuityFilters'
import { ContinuityKpiCards } from '@/features/grid_quality/components/ContinuityKpiCards'
import { ContinuityMapCard } from '@/features/grid_quality/components/ContinuityMapCard'
import { useContinuityController } from '@/features/grid_quality/hooks/useContinuityController'

/**
 * Aba "Continuidade": comparação do período B contra o A com dados da API.
 *
 * @returns Filtros e blocos da tela.
 */
export function ContinuityView() {
  const { includeEventMonth, setIncludeEventMonth, municipality, setMunicipality, municipalityNames, snapshot } =
    useContinuityController()

  return (
    <div className="flex flex-col gap-6">
      <p className="text-muted-foreground text-sm">
        DEC e FEC simplificados servem para comparar alimentadores e períodos entre si, não para medir violação regulatória. Período B: últimos 12 meses; período A: primeiros 12 meses da série.
      </p>

      <ContinuityFilters
        includeEventMonth={includeEventMonth}
        onIncludeEventMonthChange={setIncludeEventMonth}
        municipality={municipality}
        onMunicipalityChange={setMunicipality}
        municipalityNames={municipalityNames}
        eventCompetencia={snapshot.data?.event?.competencia}
      />

      <AsyncState
        isLoading={snapshot.isLoading}
        isError={snapshot.isError}
        errorTitle="Não foi possível carregar a Continuidade"
      >
        {snapshot.data ? (
          <div className="flex flex-col gap-6">
            <ContinuityKpiCards kpis={snapshot.data.kpis} />
            {snapshot.data.event ? <ContinuityEventCard event={snapshot.data.event} /> : null}
            <ContinuityMapCard municipalities={snapshot.data.municipalities} />
            <ContinuityFeedersCard feeders={snapshot.data.feeders} />
            <div className="grid gap-6 lg:grid-cols-2">
              <CauseSharesCard causes={snapshot.data.causes} />
              <TypeSharesCard types={snapshot.data.types} />
            </div>
          </div>
        ) : null}
      </AsyncState>
    </div>
  )
}
