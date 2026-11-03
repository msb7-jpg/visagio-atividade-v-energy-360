import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SelectionStrip } from '@/features/loss_management/components/SelectionStrip'
import type { QueueSummary, SuspiciousUnit } from '@/features/loss_management/types/lossTypes'

const summary: QueueSummary = {
  capacidade_total: 200,
  capacidade_programada: 58,
  selecionadas: 3,
  kwh_mes_selecionadas: 7228,
  valor_ano_selecionadas_rs: 61939.6,
  tarifa_rs_kwh: 0.7876,
  tarifa_periodo_inicio: '2025-07',
  tarifa_periodo_fim: '2026-06',
  retorno_esperado_kwh_mes: 4532,
  retorno_esperado_valor_ano_rs: 21500.4,
  taxa_acerto: {
    inspecoes_total: 1389,
    irregularidades_confirmadas: 871,
    taxa: 0.627,
    periodo_inicio: '2025-08',
    periodo_fim: '2025-12'
  }
}

function unitWithChance(idUc: string, probabilidade_acerto: number): SuspiciousUnit {
  return { id_uc: idUc, probabilidade_acerto, situacao: 'na_fila' } as SuspiciousUnit
}

const strongUnits = [unitWithChance('A', 0.915), unitWithChance('B', 0.915), unitWithChance('C', 0.915)]

function renderStrip(overrides: Partial<Parameters<typeof SelectionStrip>[0]> = {}) {
  return render(<SelectionStrip units={strongUnits} summary={summary} isUpdating={false} onClear={vi.fn()} {...overrides} />)
}

describe('SelectionStrip', () => {
  it('mostra quantas UCs foram marcadas, a energia delas e o retorno esperado vindos do servidor', () => {
    renderStrip()

    expect(screen.getByText('3 selecionadas')).toBeInTheDocument()
    expect(screen.getByText('7.228 kWh/mês · R$ 61,9 mil/ano')).toBeInTheDocument()
    expect(screen.getByText('4.532 kWh/mês · R$ 21,5 mil/ano')).toBeInTheDocument()
    expect(screen.getByText('(kWh × chance de cada UC)')).toBeInTheDocument()
  })

  it('usa o singular com uma UC', () => {
    renderStrip({ units: [unitWithChance('A', 0.915)] })

    expect(screen.getByText('1 selecionada')).toBeInTheDocument()
  })

  it('não aparece sem UC marcada', () => {
    renderStrip({ units: [] })

    expect(screen.queryByRole('region', { name: 'Resumo da seleção' })).not.toBeInTheDocument()
  })

  it('limpa a seleção ao clicar em "Limpar seleção"', () => {
    const onClear = vi.fn()
    renderStrip({ onClear })

    fireEvent.click(screen.getByRole('button', { name: 'Limpar seleção' }))

    expect(onClear).toHaveBeenCalledOnce()
  })

  it('mostra só a contagem e o limpar enquanto o primeiro resumo não chega, sem inventar números', () => {
    renderStrip({ summary: undefined })

    expect(screen.getByText('3 selecionadas')).toBeInTheDocument()
    expect(screen.queryByText(/kWh\/mês/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Limpar seleção' })).toBeInTheDocument()
  })

  it('mostra o selo de baixa chance só quando a seleção tem UC abaixo do corte de 30%', () => {
    const { rerender } = renderStrip()
    expect(screen.queryByText(/chance abaixo de 30%/)).not.toBeInTheDocument()

    rerender(
      <SelectionStrip
        units={[unitWithChance('A', 0.915), unitWithChance('B', 0.076), unitWithChance('C', 0.076)]}
        summary={summary}
        isUpdating={false}
        onClear={vi.fn()}
      />
    )

    expect(screen.getByText('2 com chance abaixo de 30%')).toBeInTheDocument()
  })

  it('sinaliza que os números estão sendo atualizados', () => {
    const { rerender } = renderStrip({ isUpdating: true })
    expect(screen.getByRole('region', { name: 'Resumo da seleção' })).toHaveAttribute('aria-busy', 'true')

    rerender(<SelectionStrip units={strongUnits} summary={summary} isUpdating={false} onClear={vi.fn()} />)
    expect(screen.getByRole('region', { name: 'Resumo da seleção' })).toHaveAttribute('aria-busy', 'false')
  })
})
