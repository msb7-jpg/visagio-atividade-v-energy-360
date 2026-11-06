import { ArrowRight } from 'lucide-react'
import { MonthPicker } from '@/components/data/MonthPicker'
import type { ComparedWindows, MonthWindow } from '@/lib/periods/periodPresets'

type WindowName = keyof ComparedWindows

const ROWS: { name: WindowName; label: string }[] = [
  { name: 'atual', label: 'Período analisado' },
  { name: 'base', label: 'Comparado com' }
]

interface CustomWindowsEditorProps {
  idPrefix: string
  windows: ComparedWindows
  available: MonthWindow
  onChange: (next: ComparedWindows) => void
}

/**
 * Datas escolhidas à mão: o primeiro e o último mês de cada período, cada um num calendário de meses.
 *
 * @param props - Prefixo dos ids, janelas em uso, meses com dados e callback.
 * @returns Duas linhas (período analisado e comparação) com os calendários de início e fim.
 */
export function CustomWindowsEditor({ idPrefix, windows, available, onChange }: CustomWindowsEditorProps) {
  const change = (name: WindowName, edge: keyof MonthWindow, competencia: string) =>
    onChange({ ...windows, [name]: { ...windows[name], [edge]: competencia } })

  return (
    <div className="bg-muted/40 border-border flex flex-wrap gap-x-8 gap-y-3 rounded-md border p-3">
      {ROWS.map(({ name, label }) => (
        <fieldset key={name} className="flex flex-col gap-1.5">
          <legend className="text-muted-foreground mb-1.5 text-xs font-medium">{label}</legend>
          <div className="flex items-center gap-2">
            <MonthPicker
              id={`${idPrefix}-${name}-inicio`}
              label={`Início: ${label.toLowerCase()}`}
              value={windows[name].inicio}
              available={available}
              range={windows[name]}
              onChange={(competencia) => change(name, 'inicio', competencia)}
            />
            <ArrowRight aria-hidden="true" className="text-muted-foreground size-4" />
            <MonthPicker
              id={`${idPrefix}-${name}-fim`}
              label={`Fim: ${label.toLowerCase()}`}
              value={windows[name].fim}
              available={available}
              range={windows[name]}
              onChange={(competencia) => change(name, 'fim', competencia)}
            />
          </div>
        </fieldset>
      ))}
    </div>
  )
}
