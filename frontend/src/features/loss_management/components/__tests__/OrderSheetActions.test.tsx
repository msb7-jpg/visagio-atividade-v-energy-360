import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Button } from '@/components/ui/button'
import { OrderSheetActions } from '@/features/loss_management/components/OrderSheetActions'
import { useCanWriteLosses } from '@/features/loss_management/hooks/useCanWriteLosses'

vi.mock('@/features/loss_management/hooks/useCanWriteLosses', () => ({ useCanWriteLosses: vi.fn(() => true) }))
vi.mock('@/features/loss_management/components/ExportOrdersButton', () => ({
  ExportOrdersButton: ({ disabled, label }: { disabled?: boolean; label?: string }) => (
    <Button type="button" variant="outline" disabled={disabled}>
      {label}
    </Button>
  )
}))

describe('OrderSheetActions', () => {
  beforeEach(() => {
    vi.mocked(useCanWriteLosses).mockReturnValue(true)
  })

  it('mostra exportar e importar, os dois neutros (contorno), e nenhum azul', () => {
    render(<OrderSheetActions canExport onImport={vi.fn()} />)

    const exportButton = screen.getByRole('button', { name: 'Exportar para o campo (CSV)' })
    const importButton = screen.getByRole('button', { name: 'Importar resultados de campo' })
    expect(exportButton).not.toHaveClass('bg-primary')
    expect(importButton).not.toHaveClass('bg-primary')
    expect(importButton).toHaveClass('border-border')
  })

  it('abre o envio da planilha ao clicar em importar', () => {
    const onImport = vi.fn()
    render(<OrderSheetActions canExport onImport={onImport} />)

    fireEvent.click(screen.getByRole('button', { name: 'Importar resultados de campo' }))

    expect(onImport).toHaveBeenCalledOnce()
  })

  it('desliga o exportar quando não há ordem para despachar', () => {
    render(<OrderSheetActions canExport={false} onImport={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Exportar para o campo (CSV)' })).toBeDisabled()
  })

  it('deixa só o exportar para quem não pode editar perdas', () => {
    vi.mocked(useCanWriteLosses).mockReturnValue(false)
    render(<OrderSheetActions canExport onImport={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Exportar para o campo (CSV)' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Importar resultados de campo' })).not.toBeInTheDocument()
  })
})
