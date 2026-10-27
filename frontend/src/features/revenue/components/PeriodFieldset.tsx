import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { PeriodWindow } from '@/features/revenue/types/revenueTypes'
import type { WindowEdge } from '@/features/revenue/hooks/useRevenueFilters'
import { dateToMonth, monthToDate } from '@/features/revenue/utils/revenueDates'

interface PeriodFieldsetProps {
  idPrefix: string
  legend: string
  window: PeriodWindow
  onChange: (edge: WindowEdge, month: string) => void
}

/**
 * Par de campos de data (início e fim) de uma janela de comparação.
 * A API trabalha por competência (mês): o campo mostra o primeiro dia do mês inicial e o último dia do mês final,
 * e qualquer dia escolhido vale como o mês inteiro.
 *
 * @param props - Prefixo dos ids, legenda, janela atual e callback com a competência `YYYY-MM`.
 * @returns Grupo `fieldset` acessível com dois campos `date`.
 */
export function PeriodFieldset({ idPrefix, legend, window, onChange }: PeriodFieldsetProps) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-foreground mb-2 text-sm font-semibold">{legend}</legend>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${idPrefix}-inicio`}>De</Label>
          <Input
            id={`${idPrefix}-inicio`}
            type="date"
            className="scheme-dark in-[.light]:scheme-light"
            value={monthToDate(window.inicio, 'inicio')}
            max={monthToDate(window.fim, 'fim')}
            onChange={(event) => onChange('inicio', dateToMonth(event.target.value))}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${idPrefix}-fim`}>Até</Label>
          <Input
            id={`${idPrefix}-fim`}
            type="date"
            className="scheme-dark in-[.light]:scheme-light"
            value={monthToDate(window.fim, 'fim')}
            min={monthToDate(window.inicio, 'inicio')}
            onChange={(event) => onChange('fim', dateToMonth(event.target.value))}
          />
        </div>
      </div>
    </fieldset>
  )
}
