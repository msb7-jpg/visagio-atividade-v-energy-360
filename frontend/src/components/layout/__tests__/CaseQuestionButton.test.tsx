import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { CaseQuestionButton } from '@/components/layout/CaseQuestionButton'

describe('CaseQuestionButton', () => {
  it('renderiza o botão na rota comercial (/revenue) e exibe a citação de Henrique Duarte ao clicar', async () => {
    render(
      <MemoryRouter initialEntries={['/revenue']}>
        <CaseQuestionButton />
      </MemoryRouter>
    )

    const button = screen.getByRole('button', { name: /pergunta do case/i })
    expect(button).toBeInTheDocument()

    fireEvent.click(button)

    expect(await screen.findByText('Henrique Duarte')).toBeInTheDocument()
    expect(screen.getByText(/tarifa residencial acumulou reajuste homologado de 10,5%/i)).toBeInTheDocument()
  })

  it('renderiza o botão na rota de painel (/dashboard) com a citação de Patrícia Lins', async () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <CaseQuestionButton />
      </MemoryRouter>
    )

    const button = screen.getByRole('button', { name: /pergunta do case/i })
    expect(button).toBeInTheDocument()

    fireEvent.click(button)

    expect(await screen.findByText('Patrícia Lins')).toBeInTheDocument()
    expect(screen.getByText(/cada sistema exporta de um jeito/i)).toBeInTheDocument()
  })

  it('não renderiza o botão em rotas sem pergunta cadastrada', () => {
    render(
      <MemoryRouter initialEntries={['/rota-inexistente']}>
        <CaseQuestionButton />
      </MemoryRouter>
    )

    expect(screen.queryByRole('button', { name: /pergunta do case/i })).not.toBeInTheDocument()
  })
})
