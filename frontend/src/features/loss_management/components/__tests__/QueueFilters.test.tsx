import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { QueueFilters } from '@/features/loss_management/components/QueueFilters'
import type { QueueFilterOptions } from '@/features/loss_management/types/lossTypes'

const options: QueueFilterOptions = {
  municipios: ['OLINDA', 'RECIFE'],
  classes: ['INDUSTRIAL', 'RESIDENCIAL'],
  contagens: {
    municipios: { OLINDA: 15, RECIFE: 1234 },
    classes: { INDUSTRIAL: 0, RESIDENCIAL: 161 },
    motivos: { queda_subita: 0, queda_moderada: 162, leitura_zerada: 0 }
  }
}

/** `null` representa as opções que ainda não chegaram da API (um `undefined` ativaria o valor padrão). */
function renderFilters(filterOptions: QueueFilterOptions | null = options) {
  render(<QueueFilters filters={{}} options={filterOptions ?? undefined} onChange={vi.fn()} onClear={vi.fn()} />)
  fireEvent.click(screen.getByRole('button', { name: /^Filtros/ }))
}

describe('QueueFilters', () => {
  it('mostra ao lado de cada município e classe quantas UCs da fila ele devolve, sem mudar o valor enviado', async () => {
    renderFilters()

    expect(await screen.findByRole('option', { name: 'Olinda (15)' })).toHaveValue('OLINDA')
    expect(screen.getByRole('option', { name: 'Recife (1.234)' })).toHaveValue('RECIFE')
    expect(screen.getByRole('option', { name: 'Residencial (161)' })).toHaveValue('RESIDENCIAL')
  })

  it('mostra zero nas opções que nenhuma UC da fila tem, em vez de escondê-las', async () => {
    renderFilters()

    expect(await screen.findByRole('option', { name: 'Industrial (0)' })).toHaveValue('INDUSTRIAL')
    expect(screen.getByRole('option', { name: 'Queda abrupta de consumo (0)' })).toHaveValue('queda_subita')
    expect(screen.getByRole('option', { name: 'Consumo zero com medidor ativo (0)' })).toHaveValue('leitura_zerada')
  })

  it('mostra a contagem de cada motivo', async () => {
    renderFilters()

    expect(await screen.findByRole('option', { name: 'Queda moderada de consumo (162)' })).toHaveValue('queda_moderada')
  })

  it('mantém sem contagem as opções que significam "todos"', async () => {
    renderFilters()

    expect(await screen.findByRole('option', { name: 'Todos os motivos' })).toHaveValue('')
    expect(screen.getByRole('option', { name: 'Todos' })).toHaveValue('')
    expect(screen.getByRole('option', { name: 'Todas' })).toHaveValue('')
  })

  it('não quebra com um backend anterior à contagem: mostra os nomes sem número', async () => {
    renderFilters({ municipios: ['RECIFE'], classes: ['RESIDENCIAL'] } as QueueFilterOptions)

    expect(await screen.findByRole('option', { name: 'Recife' })).toHaveValue('RECIFE')
    expect(screen.getByRole('option', { name: 'Residencial' })).toHaveValue('RESIDENCIAL')
    expect(screen.getByRole('option', { name: 'Queda moderada de consumo' })).toHaveValue('queda_moderada')
  })

  it('lista os motivos sem contagem enquanto as opções não chegam', async () => {
    renderFilters(null)

    expect(await screen.findByRole('option', { name: 'Queda moderada de consumo' })).toHaveValue('queda_moderada')
    expect(screen.queryByRole('option', { name: /\(\d/ })).not.toBeInTheDocument()
  })
})
