import { ChevronDown } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'

interface FilterSelectProps {
  id: string
  label: string
  allLabel: string
  value: string
  options: string[]
  onChange: (value: string) => void
}

/**
 * Seletor de filtro com rótulo, opção "todos" e uma seta própria (lucide) por cima da seta nativa do navegador.
 *
 * @param props - Id, rótulos, valor atual, opções e callback de alteração.
 * @returns Campo `Select` do design system com o ícone de seta.
 */
export function FilterSelect({ id, label, allLabel, value, options, onChange }: FilterSelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Select id={id} value={value} onChange={(event) => onChange(event.target.value)}>
          <option value="">{allLabel}</option>
          {options.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </Select>
        <div className="bg-background pointer-events-none absolute inset-y-px right-px flex w-10 items-center justify-center rounded-r-xl">
          <ChevronDown className="text-muted-foreground size-4" />
        </div>
      </div>
    </div>
  )
}
