import { useState, type ReactNode } from 'react'
import { ListFilter, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export interface ActiveFilterChip {
  key: string
  /** Texto do chip, como "Motivo: Queda súbita". */
  label: string
  onRemove: () => void
}

interface FilterPopoverProps {
  activeFilters: ActiveFilterChip[]
  onClear: () => void
  /** Campos do filtro; cada mudança vale na hora, o painel só esconde os campos. */
  children: ReactNode
}

/**
 * Filtros recolhidos: um botão "Filtros" com o contador, o painel com os campos e um chip por filtro ativo.
 * O painel fecha com "Concluir", `Esc` ou clique fora; cada chip remove o seu filtro.
 *
 * @param props - Chips dos filtros ativos, callback de limpeza e os campos do painel.
 * @returns Linha com o botão, os chips e "Limpar filtros" (só com algum filtro ativo).
 */
export function FilterPopover({ activeFilters, onClear, children }: FilterPopoverProps) {
  const [isOpen, setIsOpen] = useState(false)
  const activeCount = activeFilters.length

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" aria-label={activeCount > 0 ? `Filtros (${activeCount} ativos)` : 'Filtros'}>
            <ListFilter aria-hidden="true" />
            Filtros
            {activeCount > 0 ? <span aria-hidden="true">({activeCount})</span> : null}
          </Button>
        </PopoverTrigger>
        <PopoverContent aria-label="Filtros">
          <div className="flex flex-col gap-3">
            {children}
            <Button type="button" onClick={() => setIsOpen(false)}>Concluir</Button>
          </div>
        </PopoverContent>
      </Popover>
      {activeFilters.map((chip) => (
        <Button
          key={chip.key}
          type="button"
          variant="secondary"
          size="sm"
          aria-label={`Remover filtro ${chip.label}`}
          onClick={chip.onRemove}
        >
          {chip.label}
          <X aria-hidden="true" />
        </Button>
      ))}
      {activeCount > 0 ? <Button type="button" variant="ghost" size="sm" onClick={onClear}>Limpar filtros</Button> : null}
    </div>
  )
}
