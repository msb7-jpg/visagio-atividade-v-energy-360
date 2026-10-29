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

describe('QueueSummaryCards', () => {
  it('mostra a energia das selecionadas, o valor anual e a tarifa média de 12 meses do servidor', () => {
    render(<QueueSummaryCards summary={summary} isUpdating={false} isError={false} onRetry={vi.fn()} />)

    expect(screen.getByText('7.228')).toBeInTheDocument()
    expect(screen.getByText('R$ 61,9 mil/ano')).toBeInTheDocument()
    expect(screen.getByText('Tarifa média de 12 meses: R$ 0,79/kWh (jul/2025–jun/2026)')).toBeInTheDocument()
  })

  it('mostra o retorno esperado vindo do servidor, sem reaplicar a taxa histórica global', () => {
    render(<QueueSummaryCards summary={summary} isUpdating={false} isError={false} onRetry={vi.fn()} />)

    expect(screen.getByText('4.532')).toBeInTheDocument()
    expect(screen.getByText('R$ 21,5 mil/ano · soma da energia × chance de acerto de cada UC')).toBeInTheDocument()
    // 61.939,6 x 62,7% daria R$ 38,8 mil: o valor do card é o do servidor, não esse.
    expect(screen.queryByText(/R\$ 38,8 mil/)).not.toBeInTheDocument()
  })

  it('mostra o esqueleto enquanto o primeiro resumo não chega', () => {
    render(<QueueSummaryCards summary={undefined} isUpdating={false} isError={false} onRetry={vi.fn()} />)

    expect(screen.queryByText('Capacidade do mês')).not.toBeInTheDocument()
  })

  it('sinaliza que os números estão sendo atualizados', () => {
    render(<QueueSummaryCards summary={summary} isUpdating isError={false} onRetry={vi.fn()} />)

    expect(screen.getByRole('region', { name: 'Resumo da capacidade e do retorno' })).toHaveAttribute('aria-busy', 'true')
  })

  it('não sinaliza atualização quando o resumo está em dia', () => {
    render(<QueueSummaryCards summary={summary} isUpdating={false} isError={false} onRetry={vi.fn()} />)

    expect(screen.getByRole('region', { name: 'Resumo da capacidade e do retorno' })).toHaveAttribute('aria-busy', 'false')
  })
})

describe('HitRateCard', () => {
  it('mostra a taxa, as inspeções confirmadas e o período no mesmo ano', () => {
    render(<QueueSummaryCards summary={summary} isUpdating={false} isError={false} onRetry={vi.fn()} />)

    expect(screen.getByText('62,7%')).toBeInTheDocument()
    expect(screen.getByText('871 de 1.389 inspeções com irregularidade confirmada · ago–dez/2025')).toBeInTheDocument()
  })

  it('mostra o período com os dois anos quando o histórico atravessa a virada', () => {
    const acrossYears = { ...summary, taxa_acerto: { ...hitRate, periodo_inicio: '2025-11', periodo_fim: '2026-02' } }

    render(<QueueSummaryCards summary={acrossYears} isUpdating={false} isError={false} onRetry={vi.fn()} />)

    expect(screen.getByText(/nov\/2025–fev\/2026/)).toBeInTheDocument()
  })

  it('avisa que usa a taxa geral quando não há histórico de campo', () => {
    const withoutHistory = {
      ...summary,
      taxa_acerto: { inspecoes_total: null, irregularidades_confirmadas: null, taxa: 0.627, periodo_inicio: null, periodo_fim: null }
    }

    render(<QueueSummaryCards summary={withoutHistory} isUpdating={false} isError={false} onRetry={vi.fn()} />)

    expect(screen.getByText(/Histórico de campo indisponível/)).toBeInTheDocument()
    expect(screen.getByText('62,7%')).toBeInTheDocument()
  })

  it('mostra o ErrorState com "Tentar novamente" quando o resumo falha', () => {
    const onRetry = vi.fn()
    render(<QueueSummaryCards summary={undefined} isUpdating={false} isError onRetry={onRetry} />)

    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível carregar o resumo da capacidade e do retorno')
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('abre a explicação da taxa quando o link recebe foco pelo teclado', async () => {
    render(<QueueSummaryCards summary={summary} isUpdating={false} isError={false} onRetry={vi.fn()} />)

    fireEvent.focus(screen.getByRole('button', { name: 'como calculamos' }))

    expect(await screen.findByText(/Taxa = inspeções com irregularidade confirmada/)).toBeInTheDocument()
  })
})
