import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { decompositionFixture } from '@/features/revenue/__tests__/revenueFixtures'
import { RevenueWaterfallCard } from '@/features/revenue/components/RevenueWaterfallCard'

function renderCard(props: Partial<Parameters<typeof RevenueWaterfallCard>[0]> = {}) {
  return render(
    <RevenueWaterfallCard decomposition={decompositionFixture} isLoading={false} isError={false} error={null} {...props} />
  )
}

describe('RevenueWaterfallCard', () => {
  it('mostra a leitura em uma frase e as seis colunas da ponte', () => {
    renderCard()

    expect(screen.getByText(/A receita caiu/)).toBeInTheDocument()
    ;['Receita base', 'Efeito-preço', 'Efeito-volume', 'Efeito-mix', 'Efeito cruzado', 'Receita atual'].forEach((label) =>
      expect(screen.getAllByText(label).length).toBeGreaterThan(0)
    )
  })

  it('avisa que o eixo não começa em zero', () => {
    renderCard()

    expect(screen.getByText(/não em zero/)).toBeInTheDocument()
  })

  it('deixa cada coluna alcançável pelo teclado, com valor e explicação para leitores de tela', () => {
    renderCard()

    const columns = screen.getAllByRole('img')
    expect(columns).toHaveLength(6)
    columns.forEach((column) => expect(column).toHaveAttribute('tabindex', '0'))
    expect(screen.getByRole('img', { name: /Efeito-preço:.*em cada segmento/ })).toBeInTheDocument()
  })

  it('abre a explicação da coluna ao receber o foco do teclado', () => {
    renderCard()

    expect(screen.queryByText(/sem trocar a composição do consumo/)).not.toBeInTheDocument()
    fireEvent.focus(screen.getByRole('img', { name: /Efeito-volume/ }))

    expect(screen.getByText(/sem trocar a composição do consumo/)).toBeInTheDocument()
  })

  it('mostra a mensagem do backend quando a consulta falha', () => {
    renderCard({ decomposition: undefined, isError: true, error: new Error('rede') })

    expect(screen.getByText('Não foi possível carregar a decomposição')).toBeInTheDocument()
  })

  it('não desenha o gráfico enquanto carrega', () => {
    renderCard({ decomposition: undefined, isLoading: true })

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })
})
