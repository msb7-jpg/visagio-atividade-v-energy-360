import { AlertTriangle, RotateCcw } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FilterSelect } from '@/features/revenue/components/FilterSelect'
import { PeriodFieldset } from '@/features/revenue/components/PeriodFieldset'
import type { WindowEdge, WindowName } from '@/features/revenue/hooks/useRevenueFilters'
import type { RevenueFilters, RevenueQuery } from '@/features/revenue/types/revenueTypes'

interface RevenueFiltersBarProps {
  query: RevenueQuery
  windowError: string | null
  municipalities: string[]
  classes: string[]
  onMonthChange: (window: WindowName, edge: WindowEdge, month: string) => void
  onFilterChange: (name: keyof RevenueFilters, value: string) => void
  onReset: () => void
}

/**
 * Barra de filtros: período base, período de comparação, município e classe de consumo.
 * Janelas inválidas mostram um aviso e suspendem as consultas (sem erro 400 da API).
 *
 * @param props - Seleção atual, erro das janelas, opções dos seletores e callbacks.
 * @returns Card de filtros com aviso opcional.
 */
export function RevenueFiltersBar(props: RevenueFiltersBarProps) {
  const { query, windowError, municipalities, classes, onMonthChange, onFilterChange, onReset } = props
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
        <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FilterSelect
            id="filtro-municipio"
            label="Município"
            allLabel="Todos os municípios"
            value={query.filters.municipio ?? ''}
            options={municipalities}
            onChange={(value) => onFilterChange('municipio', value)}
          />
          <FilterSelect
            id="filtro-classe"
            label="Classe de consumo"
            allLabel="Todas as classes"
            value={query.filters.classe_consumo ?? ''}
            options={classes}
            onChange={(value) => onFilterChange('classe_consumo', value)}
          />
          <div>
            <Button variant="outline" onClick={onReset}>
              <span className="flex items-center gap-1.5">
                <RotateCcw className="size-3.5" /> Restaurar padrão
              </span>
            </Button>
          </div>
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
