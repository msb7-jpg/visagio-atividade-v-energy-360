import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { BrandMark } from '@/components/layout/BrandMark'

describe('BrandMark', () => {
  it('mostra o logo como imagem decorativa, sem repetir o nome para leitores de tela', () => {
    const { container } = render(<BrandMark />)

    const logo = container.querySelector('img')
    expect(logo).toHaveAttribute('src', expect.stringContaining('logo-venergy'))
    expect(logo).toHaveAttribute('alt', '')
    expect(logo).toHaveClass('size-12')
  })

  it('mostra o nome do produto por padrão e o esconde com withName={false}', () => {
    const { rerender } = render(<BrandMark />)
    expect(screen.getByText('V-Energy Grid 360')).toBeInTheDocument()

    rerender(<BrandMark withName={false} />)
    expect(screen.queryByText('V-Energy Grid 360')).not.toBeInTheDocument()
  })
})
