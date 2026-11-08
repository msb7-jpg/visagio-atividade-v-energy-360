import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { QueueReturnCurve } from '@/features/loss_management/components/QueueReturnCurve'
import type { ReturnCurve } from '@/features/loss_management/types/queueCurveTypes'

const curve: ReturnCurve = {
  total_ucs: 31,
  tarifa_rs_kwh: 0.7876,
  custo_inspecao_rs: 150,
  corte_sugerido: 3,
  pontos: [
    { posicao: 10, kwh_mes_acumulado: 70, valor_ano_acumulado_rs: 660 },
    { posicao: 31, kwh_mes_acumulado: 150, valor_ano_acumulado_rs: 1415 }
  ]
}

function renderCurve(overrides: Partial<Parameters<typeof QueueReturnCurve>[0]> = {}) {
  return render(
    <QueueReturnCurve
      curve={curve}
      isError={false}
      costText="150"
      isStale={false}
      onCostChange={vi.fn()}
      onUseCut={vi.fn()}
      onRetry={vi.fn()}
      {...overrides}
    />
  )
}

describe('QueueReturnCurve', () => {
  it('diz quantas inspeções valem a pena e o retorno esperado de toda a fila livre', () => {
    renderCurve()

    expect(screen.getByText(/vale inspecionar as 3 primeiras UCs de 31/)).toBeInTheDocument()
    expect(screen.getByText(/Retorno esperado das 31 UCs livres: .*1\.415.*\/ano/)).toBeInTheDocument()
  })

  it('preenche o número a inspecionar com o corte sugerido', () => {
    const onUseCut = vi.fn()
    renderCurve({ onUseCut })

    fireEvent.click(screen.getByRole('button', { name: 'Usar o corte sugerido (3)' }))

    expect(onUseCut).toHaveBeenCalledWith(3)
  })

  it('não deixa aplicar o corte enquanto a curva mostrada é a de um custo anterior', () => {
    renderCurve({ isStale: true })

    expect(screen.getByRole('button', { name: 'Usar o corte sugerido (3)' })).toBeDisabled()
  })

  it('avisa o custo digitado ao componente pai', () => {
    const onCostChange = vi.fn()
    renderCurve({ onCostChange })

    fireEvent.change(screen.getByLabelText('Custo por inspeção (R$)'), { target: { value: '400' } })

    expect(onCostChange).toHaveBeenCalledWith('400')
  })

  it('não oferece o corte quando nenhuma visita se paga', () => {
    renderCurve({ curve: { ...curve, corte_sugerido: 0 } })

    expect(screen.getByText(/nenhuma inspeção se paga/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Usar o corte sugerido/ })).not.toBeInTheDocument()
  })

  it('pede o custo quando ainda não foi informado', () => {
    renderCurve({ costText: '', curve: { ...curve, custo_inspecao_rs: null, corte_sugerido: null } })

    expect(screen.getByText('Informe o custo de uma inspeção para ver onde parar.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Usar o corte sugerido/ })).not.toBeInTheDocument()
  })

  it('mostra o ErrorState com "Tentar novamente" quando a curva falha', () => {
    const onRetry = vi.fn()
    renderCurve({ curve: undefined, isError: true, onRetry })

    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível carregar a curva de retorno')
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(onRetry).toHaveBeenCalledOnce()
  })
})
