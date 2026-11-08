import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { QueueReferencePills } from '@/features/loss_management/components/QueueReferencePills'
import type { QueueSummary } from '@/features/loss_management/types/lossTypes'

const summary: QueueSummary = {
  capacidade_programada: 58,
  selecionadas: 0,
  kwh_mes_selecionadas: 0,
  valor_ano_selecionadas_rs: 0,
  tarifa_rs_kwh: 0.7876,
  tarifa_periodo_inicio: '2025-07',
  tarifa_periodo_fim: '2026-06',
  retorno_esperado_kwh_mes: 0,
  retorno_esperado_valor_ano_rs: 0,
  taxa_acerto: {
    inspecoes_total: 1389,
    irregularidades_confirmadas: 871,
    taxa: 0.627,
    periodo_inicio: '2025-08',
    periodo_fim: '2025-12'
  }
}

function renderPills(overrides: Partial<Parameters<typeof QueueReferencePills>[0]> = {}) {
  return render(<QueueReferencePills summary={summary} isError={false} onRetry={vi.fn()} {...overrides} />)
}

describe('QueueReferencePills', () => {
  it('mostra a tarifa média de 12 meses que o servidor usou para converter kWh em reais', () => {
    renderPills()

    expect(screen.getByText('Tarifa média de 12 meses: R$ 0,79/kWh (jul/2025–jun/2026)')).toBeInTheDocument()
  })

  it('explica no tooltip que o valor é uma estimativa conservadora frente ao que o campo recuperou', async () => {
    renderPills()

    fireEvent.focus(screen.getByRole('button', { name: 'como calculamos' }))

    expect(
      await screen.findByText('Estimativa de 10 meses de déficit, a mediana recuperada em campo (metade das inspeções, de 7,6 a 12,9 meses)')
    ).toBeInTheDocument()
  })

  it('não mostra a tarifa enquanto o primeiro resumo não chega', () => {
    renderPills({ summary: undefined })

    expect(screen.queryByText(/Tarifa média de 12 meses/)).not.toBeInTheDocument()
  })

  it('mostra o ErrorState com "Tentar novamente" quando o resumo falha', () => {
    const onRetry = vi.fn()
    renderPills({ summary: undefined, isError: true, onRetry })

    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível carregar o resumo da energia e do retorno')
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(onRetry).toHaveBeenCalledOnce()
  })
})
