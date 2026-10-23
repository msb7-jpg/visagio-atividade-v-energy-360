import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ChatDrawer } from './ChatDrawer'

describe('ChatDrawer', () => {
  it('deve renderizar o gatilho do assistente IA', () => {
    render(<ChatDrawer />)
    expect(screen.getByText('Assistente IA')).toBeInTheDocument()
  })
})
