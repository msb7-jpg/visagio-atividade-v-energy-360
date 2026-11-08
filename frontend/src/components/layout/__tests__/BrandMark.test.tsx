import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { BrandMark } from '@/components/layout/BrandMark'

describe('BrandMark', () => {
  it('desenha o símbolo amarelo, com o raio em tinta, e não o contrário', () => {
    const { container } = render(<BrandMark />)

    const symbol = container.querySelector('span[aria-hidden="true"]')
    expect(symbol).toHaveClass('bg-brand', 'text-brand-foreground')
    expect(symbol).not.toHaveClass('bg-foreground')
    expect(symbol?.querySelector('svg')).toBeInTheDocument()
  })

  it('mostra o nome do produto por padrão e o esconde com withName={false}', () => {
    const { rerender } = render(<BrandMark />)
    expect(screen.getByText('V-Energy Grid 360')).toBeInTheDocument()

    rerender(<BrandMark withName={false} />)
    expect(screen.queryByText('V-Energy Grid 360')).not.toBeInTheDocument()
  })
})
