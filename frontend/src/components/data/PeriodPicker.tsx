import { useState, type ReactNode } from 'react'
import { CalendarRange, RotateCcw } from 'lucide-react'
import { CustomWindowsEditor } from '@/components/data/CustomWindowsEditor'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import {
  baseFor,
  COMPARISONS,
  CUSTOM,
  describeMonths,
  detectSelection,
  periodPresets,
  type ComparedWindows,
  type ComparisonId,
  type MonthWindow,
  validComparisons
} from '@/lib/periods/periodPresets'

interface PeriodPickerProps {
  idPrefix: string
  windows: ComparedWindows
  /** Primeiro e último mês com dados. */
  available: MonthWindow
  isDefault: boolean
  resetLabel: string
  /** Controles extras na mesma linha, antes do botão de restaurar (ex.: os filtros de recorte). */
  extra?: ReactNode
  onChange: (next: ComparedWindows) => void
  onReset: () => void
}

/**
 * Filtro de período em duas escolhas: o que analisar e com o que comparar. As datas da base são calculadas;
 * "Personalizar datas" abre os calendários para um recorte exato. Uma frase confirma os meses comparados.
 *
 * @param props - Prefixo dos ids, janelas em uso, meses com dados, estado padrão e callbacks.
 * @returns Barra com os dois seletores, os atalhos e a frase de confirmação.
 */
export function PeriodPicker({ idPrefix, windows, available, isDefault, resetLabel, extra, onChange, onReset }: PeriodPickerProps) {
  const selection = detectSelection(windows, available)
  const [isCustomOpen, setIsCustomOpen] = useState(selection.preset === CUSTOM || selection.comparison === CUSTOM)
  const presets = periodPresets(available)
  const currentComparison: ComparisonId = selection.comparison === CUSTOM ? 'yoy' : (selection.comparison as ComparisonId)

  const allowed = validComparisons(windows.atual, available)
  const choosePreset = (presetId: string) => {
    const preset = presets.find((option) => option.id === presetId)
    if (!preset) return
    const options = validComparisons(preset.atual, available)
    const comparison = options.includes(currentComparison) ? currentComparison : options[0]
    onChange({ atual: preset.atual, base: baseFor(comparison, preset.atual) })
  }
  const chooseComparison = (comparisonId: string) => {
    onChange({ ...windows, base: baseFor(comparisonId as ComparisonId, windows.atual) })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
        <div className="flex w-56 flex-col gap-1.5">
          <Label htmlFor={`${idPrefix}-periodo`}>Período</Label>
          <Select id={`${idPrefix}-periodo`} value={selection.preset} onChange={(event) => choosePreset(event.target.value)}>
            {presets.map((preset) => <option key={preset.id} value={preset.id}>{preset.label}</option>)}
            {selection.preset === CUSTOM ? <option value={CUSTOM}>Datas personalizadas</option> : null}
          </Select>
        </div>
        <div className="flex w-80 flex-col gap-1.5">
          <Label htmlFor={`${idPrefix}-comparacao`}>Comparar com</Label>
          <Select id={`${idPrefix}-comparacao`} value={selection.comparison} onChange={(event) => chooseComparison(event.target.value)}>
            {COMPARISONS.map((comparison) => (
              <option key={comparison.id} value={comparison.id} disabled={!allowed.includes(comparison.id)}>
                {comparison.label}
              </option>
            ))}
            {selection.comparison === CUSTOM ? <option value={CUSTOM}>Datas personalizadas</option> : null}
          </Select>
        </div>
        <Button variant="outline" aria-expanded={isCustomOpen} onClick={() => setIsCustomOpen(!isCustomOpen)}>
          <CalendarRange aria-hidden="true" />
          Personalizar datas
        </Button>
        {extra}
        <Button variant="ghost" disabled={isDefault} onClick={onReset}>
          <RotateCcw aria-hidden="true" />
          {resetLabel}
        </Button>
      </div>
      <p className="text-muted-foreground text-sm">
        Comparando <span className="text-foreground font-semibold">{describeMonths(windows.atual)}</span> com{' '}
        <span className="text-foreground font-semibold">{describeMonths(windows.base)}</span>.
      </p>
      {isCustomOpen ? (
        <CustomWindowsEditor idPrefix={idPrefix} windows={windows} available={available} onChange={onChange} />
      ) : null}
    </div>
  )
}
