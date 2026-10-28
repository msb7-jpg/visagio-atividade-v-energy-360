import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'

interface FilterSelectProps {
  id: string
  label: string
  allLabel: string
  value: string
  options: string[]
  disabled?: boolean
  onChange: (value: string) => void
}

/**
 * Seletor de filtro com rótulo e opção "todos"; a seta vem do `Select` do design system.
 *
 * @param props - Id, rótulos, valor atual, opções, estado desabilitado e callback de alteração.
 * @returns Campo `Select` rotulado.
 */
export function FilterSelect({ id, label, allLabel, value, options, disabled = false, onChange }: FilterSelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Select id={id} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)}>
        <option value="">{allLabel}</option>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </Select>
    </div>
  )
}
