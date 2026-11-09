import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MarkdownRenderer } from '@/features/chat/components/renderers/MarkdownRenderer'

describe('MarkdownRenderer', () => {
  it('renderiza títulos h1, h2 e h3 com classes de escala tipográfica distintas', () => {
    const content = [
      '# Título Principal H1',
      '## Seção Analítica H2',
      '### Subseção Operacional H3',
      'Parágrafo descritivo com **destaque**.'
    ].join('\n\n')

    render(<MarkdownRenderer content={content} />)

    const h1 = screen.getByRole('heading', { level: 1, name: 'Título Principal H1' })
    const h2 = screen.getByRole('heading', { level: 2, name: 'Seção Analítica H2' })
    const h3 = screen.getByRole('heading', { level: 3, name: 'Subseção Operacional H3' })

    expect(h1.className).toContain('text-xl')
    expect(h2.className).toContain('text-lg')
    expect(h3.className).toContain('text-base')
    expect(screen.getByText('destaque')).toBeInTheDocument()
  })

  it('renderiza sintaxe de grifo estilo Obsidian ==texto== como elemento <mark> embutido', () => {
    const content = 'A receita subiu ==+8,0% no período== impulsionada por ==R$ 19,6 milhões de efeito-preço==.'

    render(<MarkdownRenderer content={content} />)

    const firstMark = screen.getByText('+8,0% no período')
    const secondMark = screen.getByText('R$ 19,6 milhões de efeito-preço')

    expect(firstMark.tagName).toBe('MARK')
    expect(firstMark.className).toContain('bg-primary/25')
    expect(secondMark.tagName).toBe('MARK')
  })

  it('converte comandos inline em CommandBadge quando iniciam com barra', () => {
    render(<MarkdownRenderer content="Use `/sql faturamento` para consultar." />)
    expect(screen.getByText('/sql')).toBeInTheDocument()
  })
})
