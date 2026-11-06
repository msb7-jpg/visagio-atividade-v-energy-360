import { AlertTriangle } from 'lucide-react'
import { PeriodPicker } from '@/components/data/PeriodPicker'
import { FilterPopover, type ActiveFilterChip } from '@/components/filters/FilterPopover'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { FilterSelect } from '@/features/revenue/components/FilterSelect'
import type { RevenueFilters, RevenueQuery } from '@/features/revenue/types/revenueTypes'
import { DEFAULT_REVENUE_QUERY, REVENUE_AVAILABLE_MONTHS } from '@/features/revenue/utils/revenueFilters'

const isDefaultQuery = (query: RevenueQuery) => JSON.stringify(query) === JSON.stringify(DEFAULT_REVENUE_QUERY)

const FILTER_LABELS: Record<keyof RevenueFilters, string> = {
  municipio: 'Município',
  bairro: 'Bairro',
  classe_consumo: 'Classe'
}

function activeChips(filters: RevenueFilters, onFilterChange: RevenueFiltersBarProps['onFilterChange']): ActiveFilterChip[] {
  return (Object.keys(FILTER_LABELS) as (keyof RevenueFilters)[])
    .filter((name) => Boolean(filters[name]))
    .map((name) => ({ key: name, label: `${FILTER_LABELS[name]}: ${filters[name]}`, onRemove: () => onFilterChange(name, '') }))
}

interface RevenueFiltersBarProps {
  query: RevenueQuery
  windowError: string | null
  municipalities: string[]
  neighborhoods: string[]
  classes: string[]
  onWindowsChange: (windows: Pick<RevenueQuery, 'base' | 'atual'>) => void
  onFilterChange: (name: keyof RevenueFilters, value: string) => void
  onReset: () => void
}

/**
 * Barra de filtros: o seletor de período (o que analisar e com o que comparar) fica visível; município, bairro e classe
 * ficam no botão "Filtros" (`FilterPopover`), com um chip por filtro ativo.
 * O bairro só pode ser escolhido depois do município, e a lista mostra apenas os bairros dele.
 * Janelas inválidas mostram um aviso e suspendem as consultas (sem erro 400 da API).
 *
 * @param props - Seleção atual, erro das janelas, opções dos seletores e callbacks.
 * @returns Card de filtros com aviso opcional.
 */
export function RevenueFiltersBar(props: RevenueFiltersBarProps) {
  const { query, windowError, municipalities, neighborhoods, classes, onWindowsChange, onFilterChange, onReset } = props
  return (
    <div className="flex flex-col gap-3">
      <PeriodPicker
        idPrefix="receita"
        windows={{ base: query.base, atual: query.atual }}
        available={REVENUE_AVAILABLE_MONTHS}
        isDefault={isDefaultQuery(query)}
        resetLabel="Restaurar padrão"
        onChange={onWindowsChange}
        onReset={onReset}
        extra={(
          <FilterPopover
            activeFilters={activeChips(query.filters, onFilterChange)}
            onClear={() => {
              onFilterChange('classe_consumo', '')
              onFilterChange('municipio', '')
            }}
          >
            <FilterSelect
              id="filtro-municipio"
              label="Município"
              allLabel="Todos os municípios"
              value={query.filters.municipio ?? ''}
              options={municipalities}
              onChange={(value) => onFilterChange('municipio', value)}
            />
            <FilterSelect
              id="filtro-bairro"
              label="Bairro"
              allLabel={query.filters.municipio ? 'Todos os bairros' : 'Escolha um município'}
              value={query.filters.bairro ?? ''}
              options={neighborhoods}
              disabled={!query.filters.municipio}
              onChange={(value) => onFilterChange('bairro', value)}
            />
            <FilterSelect
              id="filtro-classe"
              label="Classe de consumo"
              allLabel="Todas as classes"
              value={query.filters.classe_consumo ?? ''}
              options={classes}
              onChange={(value) => onFilterChange('classe_consumo', value)}
            />
          </FilterPopover>
        )}
      />
      {windowError ? (
        <Alert variant="warning">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <div>
            <AlertTitle>Ajuste os períodos</AlertTitle>
            <AlertDescription>{windowError}</AlertDescription>
          </div>
        </Alert>
      ) : null}
    </div>
  )
}
