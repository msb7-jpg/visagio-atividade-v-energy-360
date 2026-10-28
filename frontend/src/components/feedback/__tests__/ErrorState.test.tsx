import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { ErrorState } from '@/components/feedback/ErrorState'

const DETAIL = 'GET /api/receita/ponte · 504 · req 7f3a-21c9'

describe('ErrorState', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('announces the failure with title and description', () => {
    render(<ErrorState title="Não foi possível carregar a ponte" description="O serviço demorou demais." />)

    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível carregar a ponte')
    expect(screen.getByText('O serviço demorou demais.')).toBeInTheDocument()
  })

  test('hides the retry and copy actions when there is nothing to retry or copy', () => {
    render(<ErrorState title="Falha" />)

    expect(screen.queryByRole('button', { name: 'Tentar novamente' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Copiar detalhes para o suporte' })).not.toBeInTheDocument()
  })

  test('calls onRetry from the primary button', () => {
    const onRetry = vi.fn()
    render(<ErrorState title="Falha" onRetry={onRetry} />)

    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  test('shows the technical detail and copies it for support', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    render(<ErrorState title="Falha" detail={DETAIL} />)

    expect(screen.getByText(DETAIL)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Copiar detalhes para o suporte' }))

    await waitFor(() => expect(screen.getByRole('button', { name: 'Detalhes copiados' })).toBeInTheDocument())
    expect(writeText).toHaveBeenCalledWith(DETAIL)
  })

  test('tells the user when the clipboard is unavailable', async () => {
    vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) } })
    render(<ErrorState title="Falha" detail={DETAIL} />)

    fireEvent.click(screen.getByRole('button', { name: 'Copiar detalhes para o suporte' }))

    await waitFor(() => expect(screen.getByRole('button', { name: 'Não foi possível copiar' })).toBeInTheDocument())
  })

  test('uses the page scope to fill the content area', () => {
    render(<ErrorState title="Falha" scope="page" />)

    expect(screen.getByRole('alert')).toHaveClass('min-h-72')
  })
})
