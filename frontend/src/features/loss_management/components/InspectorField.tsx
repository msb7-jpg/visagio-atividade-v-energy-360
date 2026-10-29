import { useState } from 'react'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Command, CommandItem, CommandList } from '@/components/ui/command'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { FieldError } from '@/features/loss_management/components/FieldError'
import { useInspectorsQuery } from '@/features/loss_management/hooks/useLossQueries'

/** Acima disso a lista vira busca por digitação: 40 opções num menu simples são difíceis de percorrer. */
export const SEARCHABLE_INSPECTORS_THRESHOLD = 15

interface InspectorFieldProps {
  id: string
  value: string
  onChange: (inspectorCode: string) => void
  required?: boolean
  error?: string | null
}

interface InspectorSearchProps {
  id: string
  value: string
  codes: string[]
  hasError: boolean
  isLoading: boolean
  onChange: (inspectorCode: string) => void
}

function InspectorSearch({ id, value, codes, hasError, isLoading, onChange }: InspectorSearchProps) {
  const [query, setQuery] = useState(value)
  const listId = `${id}-lista`
  const normalizedQuery = query.trim().toLowerCase()
  const matchingCodes = codes.filter((inspectorCode) => inspectorCode.toLowerCase().includes(normalizedQuery))
  const handleQuery = (typedText: string) => {
    setQuery(typedText)
    // Texto alterado deixa de ser uma escolha: só a seleção na lista vale.
    if (typedText !== value) onChange('')
  }
  const select = (inspectorCode: string) => {
    setQuery(inspectorCode)
    onChange(inspectorCode)
  }

  // O filtro é feito aqui (e não pelo cmdk) para o Input do design system manter o `id` ligado ao rótulo.
  return (
    <Command shouldFilter={false} label="Lista de inspetores">
      <Input
        id={id}
        role="combobox"
        aria-expanded
        aria-controls={listId}
        autoComplete="off"
        value={query}
        onChange={(event) => handleQuery(event.target.value)}
        placeholder={isLoading ? 'Carregando inspetores…' : 'Digite para buscar, por exemplo INSP-014'}
        aria-busy={isLoading}
        aria-invalid={hasError}
        aria-describedby={`${id}-erro`}
        error={hasError}
      />
      <CommandList id={listId} className="static max-h-40">
        {isLoading || matchingCodes.length > 0 ? null : (
          <p className="text-muted-foreground px-3 py-4 text-center text-sm">Nenhum inspetor encontrado.</p>
        )}
        {matchingCodes.map((inspectorCode) => (
          <CommandItem key={inspectorCode} value={inspectorCode} onSelect={() => select(inspectorCode)}>
            {inspectorCode}
            {inspectorCode === value ? <Check className="size-4" aria-label="Selecionado" /> : null}
          </CommandItem>
        ))}
      </CommandList>
    </Command>
  )
}

/**
 * Campo de inspetor com a lista vinda da API: seleção simples e, com mais de 15 inspetores, busca por digitação.
 *
 * @param props - Id do campo, código escolhido, callback, obrigatoriedade e erro (do formulário ou do servidor).
 * @returns Rótulo, seletor e mensagem de erro; carregando e falha da lista têm estado próprio.
 */
export function InspectorField({ id, value, onChange, required = false, error = null }: InspectorFieldProps) {
  const { data: inspectors, isLoading, isError, refetch } = useInspectorsQuery()
  const codes = (inspectors ?? []).map((inspector) => inspector.codigo)
  // Durante o carregamento já vale a busca: a base real tem 40 inspetores e trocar o campo depois descartaria o foco inicial.
  const isSearchable = isLoading || codes.length > SEARCHABLE_INSPECTORS_THRESHOLD

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} required={required}>Inspetor</Label>
      {isError ? (
        <div className="flex items-center gap-2">
          <p className="text-destructive text-xs" role="alert">Não foi possível carregar os inspetores.</p>
          <Button type="button" size="sm" variant="outline" onClick={() => void refetch()}>Tentar novamente</Button>
        </div>
      ) : null}
      {isSearchable ? (
        <InspectorSearch id={id} value={value} codes={codes} hasError={Boolean(error)} isLoading={isLoading} onChange={onChange} />
      ) : (
        <Select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          error={Boolean(error)}
          aria-invalid={Boolean(error)}
          aria-describedby={`${id}-erro`}
        >
          <option value="">Selecione</option>
          {codes.map((inspectorCode) => <option key={inspectorCode} value={inspectorCode}>{inspectorCode}</option>)}
        </Select>
      )}
      <FieldError id={`${id}-erro`} message={error} />
    </div>
  )
}
