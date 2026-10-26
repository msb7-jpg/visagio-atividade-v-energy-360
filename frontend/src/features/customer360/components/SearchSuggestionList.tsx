import { Gauge, Sun } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { CommandEmpty, CommandItem, CommandList } from '@/components/ui/command'
import { Spinner } from '@/components/ui/spinner'
import type { CustomerSearchResult } from '@/features/customer360/types/customer360Types'

function describeLocation(suggestion: CustomerSearchResult): string {
  return [suggestion.bairro, suggestion.municipio, suggestion.classe_consumo].filter(Boolean).join(' · ')
}

interface SearchSuggestionListProps {
  suggestions: CustomerSearchResult[]
  isLoading: boolean
  onSelect: (idUc: string) => void
}

/**
 * Sugestões de UC abaixo do campo de busca, navegáveis por setas e Enter.
 *
 * @param props - Sugestões do backend, estado de carregamento e callback de escolha.
 * @returns Lista flutuante com número, medidor, localização e selo de geração solar.
 */
export function SearchSuggestionList({ suggestions, isLoading, onSelect }: SearchSuggestionListProps) {
  return (
    <CommandList label="Sugestões de unidades consumidoras" onMouseDown={(event) => event.preventDefault()}>
      {isLoading && suggestions.length === 0
        ? <div className="flex justify-center p-3"><Spinner size="sm" /></div>
        : <CommandEmpty>Nenhuma UC começa com esse número.</CommandEmpty>}
      {suggestions.map((suggestion) => (
        <CommandItem key={suggestion.id_uc} value={suggestion.id_uc} onSelect={() => onSelect(suggestion.id_uc)}>
          <div className="flex min-w-0 flex-col">
            <span className="text-foreground font-mono text-sm font-semibold">{suggestion.id_uc}</span>
            <span className="text-muted-foreground truncate text-xs">
              {suggestion.nome_titular ?? describeLocation(suggestion)}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {suggestion.numero_medidor_ativo
              ? (
                <span className="text-muted-foreground hidden items-center gap-1 text-xs sm:flex">
                  <Gauge className="size-3" /> {suggestion.numero_medidor_ativo}
                </span>
              )
              : null}
            {suggestion.possui_gd
              ? <Badge variant="secondary"><span className="flex items-center gap-1"><Sun className="size-3" /> GD</span></Badge>
              : null}
          </div>
        </CommandItem>
      ))}
    </CommandList>
  )
}
