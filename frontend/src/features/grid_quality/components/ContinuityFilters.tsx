import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatCompetencia } from '@/features/grid_quality/utils/qualityFormatters'

interface ContinuityFiltersProps {
  includeEventMonth: boolean
  onIncludeEventMonthChange: (include: boolean) => void
  municipality: string
  onMunicipalityChange: (municipality: string) => void
  municipalityNames: string[]
  /** Mês do evento detectado pela API; sem valor, o rótulo fica genérico. */
  eventCompetencia: string | undefined
}

/**
 * Filtros da Continuidade: incluir ou excluir o mês do evento e município.
 *
 * @param props - Valores atuais e callbacks de mudança.
 * @returns Barra de filtros.
 */
export function ContinuityFilters({
  includeEventMonth,
  onIncludeEventMonthChange,
  municipality,
  onMunicipalityChange,
  municipalityNames,
  eventCompetencia
}: ContinuityFiltersProps) {
  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="flex flex-col gap-1.5">
        <Label>{eventCompetencia ? `Mês do evento (${formatCompetencia(eventCompetencia)})` : 'Mês do evento'}</Label>
        <Tabs value={includeEventMonth ? 'incluir' : 'excluir'} onValueChange={(value) => onIncludeEventMonthChange(value === 'incluir')}>
          <TabsList>
            <TabsTrigger value="incluir">Incluir</TabsTrigger>
            <TabsTrigger value="excluir">Excluir</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div className="flex min-w-56 flex-col gap-1.5">
        <Label htmlFor="filtro-municipio">Município</Label>
        <Select id="filtro-municipio" value={municipality} onChange={(event) => onMunicipalityChange(event.target.value)}>
          <option value="">Todos</option>
          {municipalityNames.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </Select>
      </div>
    </div>
  )
}
