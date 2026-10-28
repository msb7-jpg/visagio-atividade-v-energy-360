import { RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
 * Seletor dos dois períodos comparados, com o retorno ao padrão do case.
 *
 * @param props - Janelas em uso, competências disponíveis, problema de validação e ações.
 * @returns Card com o início e o fim de cada período.
 */
export function PeriodSelector({ periods, months, isDefault, problem, onChange, onReset }: PeriodSelectorProps) {
  const changeLimit = (period: PeriodKey, limit: LimitKey, competencia: string) => {
    onChange({ ...periods, [period]: { ...periods[period], [limit]: competencia } })
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 pt-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {(Object.keys(PERIOD_LABELS) as PeriodKey[]).map((period) => (
            <fieldset key={period} className="flex flex-col gap-2">
              <legend className="text-foreground mb-2 text-sm font-semibold">{PERIOD_LABELS[period]}</legend>
              <div className="grid grid-cols-2 gap-3">
                {(Object.keys(LIMIT_LABELS) as LimitKey[]).map((limit) => {
                  const fieldId = `periodo-${period}-${limit}`
                  return (
                    <div key={limit} className="flex flex-col gap-1.5">
                      <Label htmlFor={fieldId}>{LIMIT_LABELS[limit]}</Label>
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
                  )
                })}
              </div>
            </fieldset>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          {problem ? <p role="alert" className="text-destructive text-sm">{problem}</p> : <span />}
          <Button variant="outline" size="sm" disabled={isDefault} onClick={onReset}>
            <RotateCcw aria-hidden="true" />
            Voltar ao padrão do case
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
