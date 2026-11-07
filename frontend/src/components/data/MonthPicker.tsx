import { useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { formatMonth, type MonthWindow } from '@/lib/periods/periodPresets'

const MONTH_LABELS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

interface MonthPickerProps {
  id: string
  /** Nome do campo para leitores de tela ("Início do período analisado"). */
  label: string
  value: string
  /** Meses com dados: fora dessa faixa o mês fica desabilitado. */
  available: MonthWindow
  /** Janela em edição, destacada no calendário para mostrar o trecho escolhido. */
  range: MonthWindow
  onChange: (competencia: string) => void
}

function variantOf(competencia: string, value: string, range: MonthWindow) {
  if (competencia === value) return 'default'
  return competencia >= range.inicio && competencia <= range.fim ? 'secondary' : 'ghost'
}

/**
 * Campo de mês com calendário próprio: o ano no topo, os 12 meses em grade e o trecho escolhido destacado.
 * A API trabalha por competência, então o calendário escolhe meses, não dias.
 *
 * @param props - Identificador, nome acessível, mês atual, faixa com dados, trecho em edição e callback.
 * @returns Botão com o mês escolhido que abre o calendário.
 */
export function MonthPicker({ id, label, value, available, range, onChange }: MonthPickerProps) {
  const [open, setOpen] = useState(false)
  const [year, setYear] = useState(() => Number(value.slice(0, 4)))
  const firstYear = Number(available.inicio.slice(0, 4))
  const lastYear = Number(available.fim.slice(0, 4))

  const openChange = (next: boolean) => {
    if (next) setYear(Number(value.slice(0, 4)))
    setOpen(next)
  }
  const choose = (competencia: string) => {
    onChange(competencia)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={openChange}>
      <PopoverTrigger asChild>
        <Button id={id} variant="outline" aria-label={`${label}: ${formatMonth(value)}`}>
          <CalendarDays aria-hidden="true" />
          {formatMonth(value)}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" aria-label={label}>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" aria-label="Ano anterior" disabled={year <= firstYear} onClick={() => setYear(year - 1)}>
              <ChevronLeft aria-hidden="true" />
            </Button>
            <span className="text-foreground text-base font-semibold tabular-nums">{year}</span>
            <Button variant="ghost" size="icon" aria-label="Próximo ano" disabled={year >= lastYear} onClick={() => setYear(year + 1)}>
              <ChevronRight aria-hidden="true" />
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {MONTH_LABELS.map((monthLabel, index) => {
              const competencia = `${year}-${String(index + 1).padStart(2, '0')}`
              const isOutside = competencia < available.inicio || competencia > available.fim
              return (
                <Button
                  key={competencia}
                  variant={variantOf(competencia, value, range)}
                  size="sm"
                  fullWidth
                  disabled={isOutside}
                  aria-pressed={competencia === value}
                  aria-label={formatMonth(competencia)}
                  onClick={() => choose(competencia)}
                >
                  {monthLabel}
                </Button>
              )
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
