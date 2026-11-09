import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ChatCaseQuestionButton } from '@/features/chat/components/header/ChatCaseQuestionButton'

describe('ChatCaseQuestionButton', () => {
  it('renderiza o botão com ícone de ajuda e abre a pergunta do case ao clicar', async () => {
    render(<ChatCaseQuestionButton />)

    const button = screen.getByRole('button', { name: /pergunta do case para o assistente ia/i })
    expect(button).toBeInTheDocument()

    fireEvent.click(button)

    expect(await screen.findByText('Patrícia Lins & Henrique Duarte')).toBeInTheDocument()
    expect(
      screen.getByText(/quero que qualquer pessoa da empresa faça uma pergunta em português/i)
    ).toBeInTheDocument()
  })
})
