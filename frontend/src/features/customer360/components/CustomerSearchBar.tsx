import type { SubmitEvent } from 'react'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'

interface CustomerSearchBarProps {
  value: string
  onChange: (typedId: string) => void
  onSubmit: () => void
  isSearching: boolean
}

/**
 * Busca da UC pelo número impresso na conta; dispara com Enter ou pelo botão.
 *
 * @param props - Texto digitado, callbacks de digitação e busca, e estado de carregamento.
 * @returns Formulário de busca da Visão 360.
 */
export function CustomerSearchBar({ value, onChange, onSubmit, isSearching }: CustomerSearchBarProps) {
  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit()
  }

  return (
    <form role="search" onSubmit={handleSubmit} className="flex max-w-2xl flex-col gap-1.5">
      <Label htmlFor="uc-search">Número da Unidade Consumidora</Label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          id="uc-search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Digite o número que está na conta (ex: UC100000)"
          autoComplete="off"
          autoFocus
        />
        <Button type="submit" disabled={isSearching || value.trim().length === 0}>
          <span className="flex items-center gap-1.5">
            {isSearching ? <Spinner variant="muted" size="sm" /> : <Search className="size-4" />} Buscar
          </span>
        </Button>
      </div>
    </form>
  )
}
