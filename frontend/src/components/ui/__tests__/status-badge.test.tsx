import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { StatusBadge } from '@/components/ui/status-badge'

describe('StatusBadge', () => {
  test('renders the closed vocabulary label for an invoice status', () => {
    render(<StatusBadge kind="fatura" status="em_aberto" />)

    expect(screen.getByText('Em aberto')).toBeInTheDocument()
  })

  test.each([
    ['fatura', 'paga', 'bg-success/15'],
    ['fatura', 'vencida', 'bg-destructive/15'],
    ['ordem', 'ordem_gerada', 'bg-warning/15'],
    ['ordem', 'em_campo', 'bg-accent'],
    ['ordem', 'cancelada', 'bg-muted'],
    ['leitura', 'estimada', 'bg-accent']
  ] as const)('maps %s/%s to the semantic tone %s', (kind, status, toneClass) => {
    render(<StatusBadge kind={kind} status={status as never} />)

    expect(screen.getByTestId('status-badge')).toHaveClass(toneClass)
  })

  test('keeps the label on one line even in a narrow table column', () => {
    render(<StatusBadge kind="ordem" status="na_fila" />)

    expect(screen.getByTestId('status-badge')).toHaveClass('whitespace-nowrap')
  })

  test('marks estimated readings with a decorative icon next to the text', () => {
    render(<StatusBadge kind="leitura" status="estimada" />)

    expect(screen.getByTestId('status-badge').querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByText('Estimada')).toBeInTheDocument()
  })
})
