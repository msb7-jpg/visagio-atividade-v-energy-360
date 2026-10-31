import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { QueueSummaryCards } from '@/features/loss_management/components/QueueSummaryCards'
import type { HitRate, QueueSummary } from '@/features/loss_management/types/lossTypes'

const hitRate: HitRate = {
  inspecoes_total: 1389,
  irregularidades_confirmadas: 871,
  taxa: 0.627,
  periodo_inicio: '2025-08',
  periodo_fim: '2025-12'
}

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
  taxa_acerto: hitRate
}

function renderCards(overrides: Partial<Parameters<typeof QueueSummaryCards>[0]> = {}) {
  return render(<QueueSummaryCards summary={summary} isUpdating={false} isError={false} onRetry={vi.fn()} {...overrides} />)
}

describe('QueueSummaryCards', () => {
  it('mostra a energia das selecionadas, o valor anual e a tarifa média de 12 meses do servidor, sem tooltip', () => {
    renderCards()

    expect(screen.getByText('7.228')).toBeInTheDocument()
    expect(screen.getByText('R$ 61,9 mil/ano')).toBeInTheDocument()
    expect(screen.getByText('Tarifa média de 12 meses: R$ 0,79/kWh (jul/2025–jun/2026)')).toBeInTheDocument()
  })

  it('explica no tooltip que o valor é uma estimativa conservadora frente ao que o campo recuperou', async () => {
    renderCards()

    fireEvent.focus(screen.getAllByRole('button', { name: 'como calculamos' })[0])

    expect(
      await screen.findByText('Estimativa de 3 meses de déficit: em campo, o recuperado foi 1,87× o estimado (mediana)')
    ).toBeInTheDocument()
  })

  it('mostra o retorno esperado vindo do servidor, sem reaplicar a taxa histórica global', () => {
    renderCards()

    expect(screen.getByText('4.532')).toBeInTheDocument()
    expect(screen.getByText('R$ 21,5 mil/ano')).toBeInTheDocument()
    // 61.939,6 x 62,7% daria R$ 38,8 mil: o valor do card é o do servidor, não esse.
    expect(screen.queryByText(/R\$ 38,8 mil/)).not.toBeInTheDocument()
  })

  it('explica no tooltip como o retorno esperado é calculado', async () => {
    renderCards()

    fireEvent.focus(screen.getAllByRole('button', { name: 'como calculamos' })[1])

    expect(await screen.findByText('Soma da energia × chance de acerto de cada UC selecionada.')).toBeInTheDocument()
  })

  it('não mostra mais os cartões de capacidade do mês nem de taxa de acerto histórica', () => {
    renderCards()

    expect(screen.queryByText('Capacidade do mês')).not.toBeInTheDocument()
    expect(screen.queryByText('Taxa de acerto histórica')).not.toBeInTheDocument()
    expect(screen.queryByText('62,7%')).not.toBeInTheDocument()
  })

  it('mostra o esqueleto enquanto o primeiro resumo não chega', () => {
    renderCards({ summary: undefined })

    expect(screen.queryByText('Energia recuperável das selecionadas')).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Resumo da energia e do retorno' })).not.toBeInTheDocument()
  })

  it('sinaliza que os números estão sendo atualizados', () => {
    renderCards({ isUpdating: true })

    expect(screen.getByRole('region', { name: 'Resumo da energia e do retorno' })).toHaveAttribute('aria-busy', 'true')
  })

  it('não sinaliza atualização quando o resumo está em dia', () => {
    renderCards()

    expect(screen.getByRole('region', { name: 'Resumo da energia e do retorno' })).toHaveAttribute('aria-busy', 'false')
  })

  it('mostra o ErrorState com "Tentar novamente" quando o resumo falha', () => {
    const onRetry = vi.fn()
    renderCards({ summary: undefined, isError: true, onRetry })

    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível carregar o resumo da energia e do retorno')
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(onRetry).toHaveBeenCalledOnce()
  })
})
