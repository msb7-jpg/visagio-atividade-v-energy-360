import { useState, type SyntheticEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import type { SuspiciousUnitsFilter } from '@/features/loss_management/types/lossTypes'

const CLASSES_CONSUMO = ['Residencial', 'Comercial', 'Industrial', 'Rural', 'Poder Publico']

interface QueueFiltersFormProps {
  onApply: (filters: SuspiciousUnitsFilter) => void
}

/**
 * Filtros da fila por município, bairro e classe, aplicados ao enviar.
 *
 * @param props - Callback que recebe os filtros preenchidos.
 * @returns Formulário de filtros.
 */
export function QueueFiltersForm({ onApply }: QueueFiltersFormProps) {
  const [municipio, setMunicipio] = useState('')
  const [bairro, setBairro] = useState('')
  const [classe, setClasse] = useState('')

  const handleSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    onApply({ municipio: municipio.trim(), bairro: bairro.trim(), classe })
  }

  const handleClear = () => {
    setMunicipio('')
    setBairro('')
    setClasse('')
    onApply({})
  }

  return (
    <form className="grid grid-cols-1 items-end gap-3 sm:grid-cols-4" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="filtro-municipio">Município</Label>
        <Input id="filtro-municipio" value={municipio} onChange={(event) => setMunicipio(event.target.value)} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="filtro-bairro">Bairro</Label>
        <Input id="filtro-bairro" value={bairro} onChange={(event) => setBairro(event.target.value)} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="filtro-classe">Classe</Label>
        <Select id="filtro-classe" value={classe} onChange={(event) => setClasse(event.target.value)}>
          <option value="">Todas</option>
          {CLASSES_CONSUMO.map((classeConsumo) => (
            <option key={classeConsumo} value={classeConsumo}>{classeConsumo}</option>
          ))}
        </Select>
      </div>
      <div className="flex gap-2">
        <Button type="submit">Filtrar</Button>
        <Button type="button" variant="ghost" onClick={handleClear}>Limpar</Button>
      </div>
    </form>
  )
}
