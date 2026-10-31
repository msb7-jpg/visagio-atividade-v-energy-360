import { FilterPopover, type ActiveFilterChip } from '@/components/filters/FilterPopover'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { labelOccurrence } from '@/features/grid_quality/utils/continuityFormatters'
import { formatCompetencia } from '@/features/grid_quality/utils/qualityFormatters'

interface ContinuityFiltersProps {
  includeEventMonth: boolean
  onIncludeEventMonthChange: (include: boolean) => void
  municipality: string
  onMunicipalityChange: (municipality: string) => void
  municipalityNames: string[]
  cause: string
  onCauseChange: (cause: string) => void
  causeOptions: string[]
  /** Mês do evento detectado pela API; sem valor, o rótulo fica genérico. */
  eventCompetencia: string | undefined
}

/**
 * Filtros da Continuidade num painel recolhido (`FilterPopover`): mês do evento, município e causa.
 * Chips: "Município: X", "Causa: Y" e "Sem o mês do evento (MM/AAAA)"; "Limpar filtros" volta ao padrão
 * (município e causa vazios, mês do evento incluído).
 *
 * @param props - Valores atuais e callbacks de mudança.
 * @returns Botão "Filtros" com os chips dos filtros ativos.
 */
export function ContinuityFilters({
  includeEventMonth,
  onIncludeEventMonthChange,
  municipality,
  onMunicipalityChange,
  municipalityNames,
  cause,
  onCauseChange,
  causeOptions,
  eventCompetencia
}: ContinuityFiltersProps) {
  const chips: ActiveFilterChip[] = []
  if (municipality) {
    chips.push({ key: 'municipio', label: `Município: ${municipality}`, onRemove: () => onMunicipalityChange('') })
  }
  if (cause) {
    chips.push({ key: 'causa', label: `Causa: ${labelOccurrence(cause)}`, onRemove: () => onCauseChange('') })
  }
  if (!includeEventMonth) {
    const eventMonth = eventCompetencia ? ` (${formatCompetencia(eventCompetencia)})` : ''
    chips.push({ key: 'evento', label: `Sem o mês do evento${eventMonth}`, onRemove: () => onIncludeEventMonthChange(true) })
  }
  const clearAll = () => {
    onMunicipalityChange('')
    onCauseChange('')
    onIncludeEventMonthChange(true)
  }

  return (
    <FilterPopover activeFilters={chips} onClear={clearAll}>
      <div className="flex flex-col gap-1.5">
        <Label>{eventCompetencia ? `Mês do evento (${formatCompetencia(eventCompetencia)})` : 'Mês do evento'}</Label>
        <Tabs value={includeEventMonth ? 'incluir' : 'excluir'} onValueChange={(value) => onIncludeEventMonthChange(value === 'incluir')}>
          <TabsList>
            <TabsTrigger value="incluir">Incluir</TabsTrigger>
            <TabsTrigger value="excluir">Excluir</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="filtro-municipio">Município</Label>
        <Select id="filtro-municipio" value={municipality} onChange={(event) => onMunicipalityChange(event.target.value)}>
          <option value="">Todos</option>
          {municipalityNames.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="filtro-causa">Causa</Label>
        <Select id="filtro-causa" value={cause} onChange={(event) => onCauseChange(event.target.value)}>
          <option value="">Todas</option>
          {causeOptions.map((option) => (
            <option key={option} value={option}>{labelOccurrence(option)}</option>
          ))}
        </Select>
      </div>
    </FilterPopover>
  )
}
