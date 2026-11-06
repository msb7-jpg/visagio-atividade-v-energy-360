import { RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import type { DashboardPeriods, PeriodWindow } from '@/features/executive_dashboard/types/executiveDashboardTypes'
import { formatMonth } from '@/features/executive_dashboard/utils/dashboardPeriods'

type PeriodKey = keyof DashboardPeriods
type LimitKey = keyof PeriodWindow

const PERIOD_LABELS: Record<PeriodKey, string> = { base: 'Período base', atual: 'Período atual' }
const LIMIT_LABELS: Record<LimitKey, string> = { competencia_inicio: 'De', competencia_fim: 'Até' }

interface PeriodSelectorProps {
  periods: DashboardPeriods
  months: string[]
  isDefault: boolean
  problem: string | null
  onChange: (periods: DashboardPeriods) => void
  onReset: () => void
}

/**
 * Seletor dos dois períodos comparados, com o retorno aos períodos padrão.
 *
 * @param props - Janelas em uso, competências disponíveis, problema de validação e ações.
 * @returns Barra com o início e o fim de cada período, em uma linha.
 */
export function PeriodSelector({ periods, months, isDefault, problem, onChange, onReset }: PeriodSelectorProps) {
  const changeLimit = (period: PeriodKey, limit: LimitKey, competencia: string) => {
    onChange({ ...periods, [period]: { ...periods[period], [limit]: competencia } })
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
        {(Object.keys(PERIOD_LABELS) as PeriodKey[]).map((period) => (
          <fieldset key={period} className="flex flex-col gap-1.5">
            <legend className="text-muted-foreground mb-1.5 text-xs font-medium">{PERIOD_LABELS[period]}</legend>
            <div className="flex items-center gap-2">
              {(Object.keys(LIMIT_LABELS) as LimitKey[]).map((limit) => {
                const fieldId = `periodo-${period}-${limit}`
                return (
                  <div key={limit} className="flex items-center gap-1.5">
                    <Label htmlFor={fieldId}>{LIMIT_LABELS[limit]}</Label>
                    <div className="w-32">
                      <Select
                        id={fieldId}
                        value={periods[period][limit]}
                        error={problem !== null}
                        onChange={(event) => changeLimit(period, limit, event.target.value)}
                      >
                        {months.map((month) => (
                          <option key={month} value={month}>{formatMonth(month)}</option>
                        ))}
                      </Select>
                    </div>
                  </div>
                )
              })}
            </div>
          </fieldset>
        ))}
        <Button variant="ghost" size="sm" disabled={isDefault} onClick={onReset}>
          <RotateCcw aria-hidden="true" />
          Restaurar períodos padrão
        </Button>
      </div>
      {problem ? <p role="alert" className="text-destructive text-sm">{problem}</p> : null}
    </div>
  )
}
