import type { ChangeEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import type {
  QueueFilterOptions,
  SuspicionReason,
  SuspiciousUnitsFilter
} from '@/features/loss_management/types/lossTypes'
import { REASON_LABELS } from '@/features/loss_management/utils/lossFormatters'
import { hasActiveFilters } from '@/features/loss_management/utils/queueFilters'
import { formatPlaceName } from '@/features/loss_management/utils/textFormat'

const REASONS: SuspicionReason[] = ['queda_subita', 'queda_moderada', 'leitura_zerada']

interface QueueFiltersProps {
  filters: SuspiciousUnitsFilter
  options: QueueFilterOptions | undefined
  onChange: (filters: SuspiciousUnitsFilter) => void
  onClear: () => void
}

/**
 * Filtros da fila priorizada: motivo, município e classe, aplicados assim que mudam.
 *
 * @param props - Filtros atuais, opções vindas do cadastro e callbacks de mudança e de limpeza.
 * @returns Linha de selects; "Limpar filtros" aparece só com algum filtro ativo.
 */
export function QueueFilters({ filters, options, onChange, onClear }: QueueFiltersProps) {
  const changeReason = (event: ChangeEvent<HTMLSelectElement>) =>
    onChange({ ...filters, motivo: REASONS.find((reason) => reason === event.target.value) })
  const changeMunicipality = (event: ChangeEvent<HTMLSelectElement>) =>
    onChange({ ...filters, municipio: event.target.value || undefined })
  const changeClass = (event: ChangeEvent<HTMLSelectElement>) => onChange({ ...filters, classe: event.target.value || undefined })

  return (
    <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="filtro-motivo">Motivo</Label>
        <Select id="filtro-motivo" value={filters.motivo ?? ''} onChange={changeReason}>
          <option value="">Todos os motivos</option>
          {REASONS.map((reason) => (
            <option key={reason} value={reason}>{REASON_LABELS[reason]}</option>
          ))}
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="filtro-municipio">Município</Label>
        <Select id="filtro-municipio" value={filters.municipio ?? ''} onChange={changeMunicipality}>
          <option value="">Todos</option>
          {(options?.municipios ?? []).map((municipality) => (
            <option key={municipality} value={municipality}>{formatPlaceName(municipality)}</option>
          ))}
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="filtro-classe">Classe</Label>
        <Select id="filtro-classe" value={filters.classe ?? ''} onChange={changeClass}>
          <option value="">Todas</option>
          {(options?.classes ?? []).map((consumptionClass) => (
            <option key={consumptionClass} value={consumptionClass}>{formatPlaceName(consumptionClass)}</option>
          ))}
        </Select>
      </div>
      {hasActiveFilters(filters) ? (
        <Button type="button" variant="ghost" onClick={onClear}>Limpar filtros</Button>
      ) : null}
    </div>
  )
}
