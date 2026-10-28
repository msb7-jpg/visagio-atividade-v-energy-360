import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Pagination } from '@/components/ui/pagination'

describe('Pagination', () => {
  it('mostra a posição, o resumo e avisa a página escolhida', () => {
    const onPageChange = vi.fn()
    render(<Pagination page={2} totalPages={3} summary="22 linhas" onPageChange={onPageChange} />)

    expect(screen.getByText('Página 2 de 3 · 22 linhas')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Próxima página' }))
    fireEvent.click(screen.getByRole('button', { name: 'Página anterior' }))

    expect(onPageChange).toHaveBeenNthCalledWith(1, 3)
    expect(onPageChange).toHaveBeenNthCalledWith(2, 1)
  })

  it('bloqueia anterior na primeira página e próxima na última', () => {
    render(<Pagination page={1} totalPages={1} onPageChange={vi.fn()} />)

    expect(screen.getByText('Página 1 de 1')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Página anterior' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Próxima página' })).toBeDisabled()
  })

  it('trata total de páginas zero como uma página', () => {
    render(<Pagination page={1} totalPages={0} label="Paginação do ranking" onPageChange={vi.fn()} />)

    expect(screen.getByRole('navigation', { name: 'Paginação do ranking' })).toBeInTheDocument()
    expect(screen.getByText('Página 1 de 1')).toBeInTheDocument()
  })
})
