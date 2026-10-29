import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ChatDrawer } from './ChatDrawer'

describe('ChatDrawer', () => {
  it('deve renderizar o botão circular flutuante e abrir o chat com sugestões', () => {
    render(<ChatDrawer />)
    const triggerButton = screen.getByRole('button', { name: /Abrir Assistente V-Energy IA/i })
    expect(triggerButton).toBeInTheDocument()

    fireEvent.click(triggerButton)
    expect(screen.getByRole('heading', { name: 'Assistente V-Energy IA', level: 3 })).toBeInTheDocument()
    expect(
      screen.getByText(/Consulte consumo, faturamento, interrupções DEC\/FEC/i)
    ).toBeInTheDocument()
    expect(
      screen.getByText('Qual a média de consumo em kWh por classe residencial?')
    ).toBeInTheDocument()
  })

  it('deve alternar para modo tela cheia e voltar ao modo flutuante', () => {
    render(<ChatDrawer />)
    const triggerButton = screen.getByRole('button', { name: /Abrir Assistente V-Energy IA/i })
    fireEvent.click(triggerButton)

    const fullscreenButton = screen.getByTitle('Tela cheia')
    expect(fullscreenButton).toBeInTheDocument()

    fireEvent.click(fullscreenButton)
    expect(screen.getByTitle('Reduzir para janela')).toBeInTheDocument()

    fireEvent.click(screen.getByTitle('Reduzir para janela'))
    expect(screen.getByTitle('Tela cheia')).toBeInTheDocument()
  })

  it('deve fechar o chat ao clicar no botão fechar', () => {
    render(<ChatDrawer />)
    const triggerButton = screen.getByRole('button', { name: /Abrir Assistente V-Energy IA/i })
    fireEvent.click(triggerButton)

    const closeButton = screen.getByTitle('Fechar assistente')
    expect(closeButton).toBeInTheDocument()

    fireEvent.click(closeButton)
    expect(screen.getByRole('button', { name: /Abrir Assistente V-Energy IA/i })).toBeInTheDocument()
  })
})
