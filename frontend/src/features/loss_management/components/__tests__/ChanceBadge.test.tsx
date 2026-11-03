import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ChanceBadge } from '@/features/loss_management/components/ChanceBadge'

describe('ChanceBadge', () => {
  it('mostra a chance de acerto em porcentagem', () => {
    render(<ChanceBadge probability={0.915} />)

    expect(screen.getByText('91,5%')).toBeInTheDocument()
  })

  it.each([0.3, 0.915, 1])('destaca em verde a chance de %s, que atinge o corte da faixa prioritária', (probability) => {
    render(<ChanceBadge probability={probability} />)

    expect(screen.getByText(/%$/).className).toContain('text-success')
  })

  it.each([0, 0.076, 0.299])('mantém neutra a chance de %s, abaixo do corte', (probability) => {
    render(<ChanceBadge probability={probability} />)

    expect(screen.getByText(/%$/).className).not.toContain('text-success')
  })
})
