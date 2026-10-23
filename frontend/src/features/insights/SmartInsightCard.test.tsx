import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SmartInsightCard } from './SmartInsightCard'

describe('SmartInsightCard', () => {
  it('deve renderizar o título e botão de gerar insights', () => {
    render(<SmartInsightCard context="customer360" />)
    expect(screen.getByText('Smart Insights IA')).toBeInTheDocument()
    expect(screen.getByText('CUSTOMER360')).toBeInTheDocument()
    expect(screen.getByText('Gerar Insights')).toBeInTheDocument()
  })
})
