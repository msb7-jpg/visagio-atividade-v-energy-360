import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CapacityCard } from '@/features/loss_management/components/CapacityCard'
import type { QueueSummary } from '@/features/loss_management/types/lossTypes'

const summary: QueueSummary = {
  capacidade_total: 200,
  capacidade_programada: 58,
  selecionadas: 3,
  kwh_mes_selecionadas: 0,
  valor_ano_selecionadas_rs: 0,
  tarifa_rs_kwh: 0.7876,
  tarifa_periodo_inicio: '2025-07',
  tarifa_periodo_fim: '2026-06',
  retorno_esperado_kwh_mes: 0,
  retorno_esperado_valor_ano_rs: 0,
  taxa_acerto: { inspecoes_total: null, irregularidades_confirmadas: null, taxa: 0.627, periodo_inicio: null, periodo_fim: null }
}

describe('CapacityCard', () => {
  it('soma programadas e selecionadas e diz quanto ainda cabe', () => {
    render(<CapacityCard summary={summary} />)

    expect(screen.getByText('61')).toBeInTheDocument()
    expect(screen.getByText(/58 programadas \+ 3 selecionadas/)).toHaveTextContent('ainda cabem 139')
  })

  it('usa o singular quando só há uma programada ou uma selecionada', () => {
    render(<CapacityCard summary={{ ...summary, capacidade_programada: 1, selecionadas: 1 }} />)

    expect(screen.getByText(/1 programada \+ 1 selecionada/)).toBeInTheDocument()
  })

  it('avisa em vermelho quando a seleção passa da capacidade', () => {
    render(<CapacityCard summary={{ ...summary, capacidade_programada: 198, selecionadas: 5 }} />)

    expect(screen.getByText(/passa da capacidade em 3/)).toHaveClass('text-destructive')
  })

  it('não gera largura inválida quando a capacidade configurada é zero', () => {
    render(<CapacityCard summary={{ ...summary, capacidade_total: 0, capacidade_programada: 0, selecionadas: 0 }} />)

    const bar = screen.getByRole('progressbar')
    expect(bar.innerHTML).not.toMatch(/NaN|Infinity/)
  })
})
