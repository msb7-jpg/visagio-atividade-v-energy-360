import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('Button', () => {
  it('renderiza com variante padrao e classes basicas', () => {
    render(<Button>Clique aqui</Button>)
    const button = screen.getByRole('button', { name: /Clique aqui/i })
    expect(button).toBeInTheDocument()
    expect(button.className).toContain('bg-brand')
    expect(button.className).toContain('h-9')
  })

  it('suporta size="multiline" com quebra de linha permitida', () => {
    render(
      <Button size="multiline" fullWidth>
        Texto analítico longo que pode quebrar em várias linhas
      </Button>
    )
    const button = screen.getByRole('button', {
      name: /Texto analítico longo que pode quebrar em várias linhas/i
    })
    expect(button).toBeInTheDocument()
    expect(button.className).toContain('h-auto')
    expect(button.className).toContain('whitespace-normal')
    expect(button.className).toContain('w-full')
  })
})
