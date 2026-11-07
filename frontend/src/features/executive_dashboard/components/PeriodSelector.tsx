import { PeriodPicker } from '@/components/data/PeriodPicker'
import type { DashboardPeriods, PeriodWindow } from '@/features/executive_dashboard/types/executiveDashboardTypes'
import { DEFAULT_PERIODS } from '@/features/executive_dashboard/utils/dashboardPeriods'
import type { MonthWindow } from '@/lib/periods/periodPresets'

const toMonths = (window: PeriodWindow): MonthWindow => ({ inicio: window.competencia_inicio, fim: window.competencia_fim })
const toPeriod = (window: MonthWindow): PeriodWindow => ({ competencia_inicio: window.inicio, competencia_fim: window.fim })

interface PeriodSelectorProps {
  periods: DashboardPeriods
  months: string[]
  isDefault: boolean
  problem: string | null
  onChange: (periods: DashboardPeriods) => void
  onReset: () => void
}

/**
 * Filtro de períodos do Painel: o período analisado, com o que comparar e, se preciso, as datas exatas.
 *
 * @param props - Janelas em uso, competências disponíveis, problema de validação e ações.
 * @returns Seletor de período compartilhado e o aviso de janelas inválidas.
 */
export function PeriodSelector({ periods, months, isDefault, problem, onChange, onReset }: PeriodSelectorProps) {
  const available: MonthWindow = {
    inicio: months[0] ?? DEFAULT_PERIODS.base.competencia_inicio,
    fim: months.at(-1) ?? DEFAULT_PERIODS.atual.competencia_fim
  }
  return (
    <div className="flex flex-col gap-2">
      <PeriodPicker
        idPrefix="periodo"
        windows={{ base: toMonths(periods.base), atual: toMonths(periods.atual) }}
        available={available}
        isDefault={isDefault}
        resetLabel="Restaurar períodos padrão"
        onChange={(next) => onChange({ base: toPeriod(next.base), atual: toPeriod(next.atual) })}
        onReset={onReset}
      />
      {problem ? <p role="alert" className="text-destructive text-sm">{problem}</p> : null}
    </div>
  )
}
