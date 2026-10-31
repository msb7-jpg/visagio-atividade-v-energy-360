import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { FilterPopover, type ActiveFilterChip } from '@/components/filters/FilterPopover'

function renderPopover(activeFilters: ActiveFilterChip[] = [], onClear = vi.fn()) {
  render(
    <FilterPopover activeFilters={activeFilters} onClear={onClear}>
      <p>Campos do filtro</p>
    </FilterPopover>
  )
}

describe('FilterPopover', () => {
  it('começa recolhido e abre os campos ao clicar em "Filtros"', () => {
    renderPopover()

    expect(screen.queryByText('Campos do filtro')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Filtros' }))

    expect(screen.getByText('Campos do filtro')).toBeInTheDocument()
  })

  it('fecha o painel ao clicar em "Concluir"', () => {
    renderPopover()
    fireEvent.click(screen.getByRole('button', { name: 'Filtros' }))

    fireEvent.click(screen.getByRole('button', { name: 'Concluir' }))

    expect(screen.queryByText('Campos do filtro')).not.toBeInTheDocument()
  })

  it('mostra o contador, um chip por filtro ativo e "Limpar filtros"', () => {
    const onClear = vi.fn()
    renderPopover([
      { key: 'motivo', label: 'Motivo: Queda súbita', onRemove: vi.fn() },
      { key: 'classe', label: 'Classe: Comercial', onRemove: vi.fn() }
    ], onClear)

    expect(screen.getByRole('button', { name: 'Filtros (2 ativos)' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remover filtro Motivo: Queda súbita' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remover filtro Classe: Comercial' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }))

    expect(onClear).toHaveBeenCalledTimes(1)
  })

  it('remove só o filtro do chip clicado', () => {
    const onRemoveMotivo = vi.fn()
    const onRemoveClasse = vi.fn()
    renderPopover([
      { key: 'motivo', label: 'Motivo: Queda súbita', onRemove: onRemoveMotivo },
      { key: 'classe', label: 'Classe: Comercial', onRemove: onRemoveClasse }
    ])

    fireEvent.click(screen.getByRole('button', { name: 'Remover filtro Classe: Comercial' }))

    expect(onRemoveClasse).toHaveBeenCalledTimes(1)
    expect(onRemoveMotivo).not.toHaveBeenCalled()
  })

  it('sem filtro ativo não mostra chips nem "Limpar filtros"', () => {
    renderPopover()

    expect(screen.queryByRole('button', { name: /^Remover filtro/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Limpar filtros' })).not.toBeInTheDocument()
  })
})
