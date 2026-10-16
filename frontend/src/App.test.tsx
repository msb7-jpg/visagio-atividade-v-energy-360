import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import App from '@/App'

describe('Smoke test V-Energy Grid 360', () => {
  it('renderiza a tela de login inicial', () => {
    render(<App />)
    expect(screen.getByText('V-Energy Grid 360')).toBeInTheDocument()
    expect(screen.getByText('Entrar no Portal')).toBeInTheDocument()
  })
})
