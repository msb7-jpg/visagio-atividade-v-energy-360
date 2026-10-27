import { Info } from 'lucide-react'
import { AsyncState } from '@/components/feedback/AsyncState'
import { Alert } from '@/components/ui/alert'
import { ContinuityEventCard } from '@/features/grid_quality/components/ContinuityEventCard'
import { ContinuityFilters } from '@/features/grid_quality/components/ContinuityFilters'
import { ContinuityKpiCards } from '@/features/grid_quality/components/ContinuityKpiCards'
import { ContinuityMapCard } from '@/features/grid_quality/components/ContinuityMapCard'
import { useContinuityController } from '@/features/grid_quality/hooks/useContinuityController'

/**
 * Aba "Continuidade": comparação do período B contra o A, com dados de exemplo até a Gold da Fatia 02.
 *
 * @returns Aviso de dados de exemplo, filtros e blocos da tela.
 */
export function ContinuityView() {
  const { includeEventMonth, setIncludeEventMonth, municipality, setMunicipality, municipalityNames, snapshot } =
    useContinuityController()

  return (
    <div className="flex flex-col gap-6">
      <Alert variant="warning">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <span>Dados de exemplo, aguardando a Gold da Fatia 02. Os números abaixo não são reais.</span>
      </Alert>
      <p className="text-muted-foreground text-sm">
        DEC e FEC simplificados servem para comparar alimentadores e períodos entre si, não para medir violação regulatória.
      </p>

      <ContinuityFilters
        includeEventMonth={includeEventMonth}
        onIncludeEventMonthChange={setIncludeEventMonth}
        municipality={municipality}
        onMunicipalityChange={setMunicipality}
        municipalityNames={municipalityNames}
      />

      <AsyncState
        isLoading={snapshot.isLoading}
        isError={snapshot.isError}
        errorTitle="Não foi possível carregar a Continuidade"
      >
        {snapshot.data ? (
          <div className="flex flex-col gap-6">
            <ContinuityKpiCards kpis={snapshot.data.kpis} />
            <ContinuityEventCard event={snapshot.data.event} />
            <ContinuityMapCard municipalities={snapshot.data.municipalities} />
          </div>
        ) : null}
      </AsyncState>
    </div>
  )
}
