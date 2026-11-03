import { AlertTriangle, RotateCcw } from 'lucide-react'
import { FilterPopover, type ActiveFilterChip } from '@/components/filters/FilterPopover'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FilterSelect } from '@/features/revenue/components/FilterSelect'
import { PeriodFieldset } from '@/features/revenue/components/PeriodFieldset'
import type { WindowEdge, WindowName } from '@/features/revenue/hooks/useRevenueFilters'
import type { RevenueFilters, RevenueQuery } from '@/features/revenue/types/revenueTypes'

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
  onMonthChange: (window: WindowName, edge: WindowEdge, month: string) => void
  onFilterChange: (name: keyof RevenueFilters, value: string) => void
  onReset: () => void
}

/**
 * Barra de filtros: os dois períodos ficam visíveis, porque são a comparação da tela; município, bairro e classe
 * ficam no botão "Filtros" (`FilterPopover`), com um chip por filtro ativo.
 * O bairro só pode ser escolhido depois do município, e a lista mostra apenas os bairros dele.
 * Janelas inválidas mostram um aviso e suspendem as consultas (sem erro 400 da API).
 *
 * @param props - Seleção atual, erro das janelas, opções dos seletores e callbacks.
 * @returns Card de filtros com aviso opcional.
 */
export function RevenueFiltersBar(props: RevenueFiltersBarProps) {
  const { query, windowError, municipalities, neighborhoods, classes, onMonthChange, onFilterChange, onReset } = props
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <PeriodFieldset
            idPrefix="base"
            legend="Período base"
            window={query.base}
            onChange={(edge, month) => onMonthChange('base', edge, month)}
          />
          <PeriodFieldset
            idPrefix="atual"
            legend="Período de comparação"
            window={query.atual}
            onChange={(edge, month) => onMonthChange('atual', edge, month)}
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
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
          <Button variant="outline" onClick={onReset}>
            <span className="flex items-center gap-1.5">
              <RotateCcw className="size-3.5" /> Restaurar padrão
            </span>
          </Button>
        </div>
        {windowError ? (
          <Alert variant="warning">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <div>
              <AlertTitle>Ajuste os períodos</AlertTitle>
              <AlertDescription>{windowError}</AlertDescription>
            </div>
          </Alert>
        ) : null}
      </CardContent>
    </Card>
  )
}
