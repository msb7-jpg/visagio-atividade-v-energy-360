import { useState, type KeyboardEvent, type SubmitEvent } from 'react'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Command, CommandInput } from '@/components/ui/command'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { SearchSuggestionList } from '@/features/customer360/components/SearchSuggestionList'
import { useCustomerSearchQuery } from '@/features/customer360/hooks/useCustomer360Queries'
import { useDebouncedValue } from '@/features/customer360/hooks/useDebouncedValue'
import { isSearchable } from '@/features/customer360/utils/searchTerms'

const SUGGESTION_DELAY_MS = 300
const SEARCH_LABEL = 'Número da UC, do medidor ou nome do titular'

interface CustomerSearchBarProps {
  initialText: string
  onSubmit: (typedText: string) => void
  isSearching: boolean
}

/**
 * Busca da UC pelo número da conta ou do medidor, em qualquer formato, ou pelo nome do titular, com sugestões enquanto digita.
 * A lista abre ao digitar. Enter abre a sugestão destacada; se as sugestões ainda não chegaram para o texto atual,
 * abre o texto digitado.
 *
 * @param props - Texto inicial (UC da URL), callback de busca e estado de carregamento.
 * @returns Campo de busca com lista de sugestões e botão Buscar.
 */
export function CustomerSearchBar({ initialText, onSubmit, isSearching }: CustomerSearchBarProps) {
  const [typedText, setTypedText] = useState(initialText)
  const [isOpen, setIsOpen] = useState(false)
  const [highlight, setHighlight] = useState({ term: '', idUc: '' })
  const debouncedText = useDebouncedValue(typedText, SUGGESTION_DELAY_MS)
  const suggestionsQuery = useCustomerSearchQuery(isOpen ? debouncedText : '')
  const suggestions = suggestionsQuery.data ?? []
  const isListVisible = isOpen && isSearchable(typedText)
  const isSuggestionStale = debouncedText !== typedText || suggestionsQuery.isPlaceholderData
  const isHighlightCurrent = highlight.term === debouncedText && suggestions.some((suggestion) => suggestion.id_uc === highlight.idUc)
  const highlightedIdUc = isHighlightCurrent ? highlight.idUc : (suggestions[0]?.id_uc ?? '')

  const submit = (text: string) => {
    setIsOpen(false)
    onSubmit(text)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      setIsOpen(false)
    }
    if (event.key === 'Enter' && (!isListVisible || isSuggestionStale || suggestions.length === 0)) {
      event.preventDefault()
      submit(typedText)
    }
  }

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    submit(typedText)
  }

  return (
    <form role="search" onSubmit={handleSubmit} className="flex max-w-2xl flex-col gap-1.5">
      <Label>{SEARCH_LABEL}</Label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Command
          shouldFilter={false}
          label={SEARCH_LABEL}
          value={highlightedIdUc}
          onValueChange={(idUc) => setHighlight({ term: debouncedText, idUc })}
          onKeyDown={handleKeyDown}
          className="flex-1"
        >
          <CommandInput
            value={typedText}
            onValueChange={(nextText) => {
              setTypedText(nextText)
              setIsOpen(true)
            }}
            onBlur={() => setIsOpen(false)}
            placeholder="Ex: 100004, UC100004, o número do medidor ou Maria da Silva"
            autoComplete="off"
            autoFocus
          />
          {isListVisible
            ? <SearchSuggestionList suggestions={suggestions} isLoading={suggestionsQuery.isFetching} onSelect={submit} />
            : null}
        </Command>
        <Button type="submit" disabled={isSearching || typedText.trim().length === 0}>
          <span className="flex items-center gap-1.5">
            {isSearching ? <Spinner variant="muted" size="sm" /> : <Search className="size-4" />} Buscar
          </span>
        </Button>
      </div>
    </form>
  )
}
