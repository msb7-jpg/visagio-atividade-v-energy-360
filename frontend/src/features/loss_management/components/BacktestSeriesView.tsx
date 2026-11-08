import type { ChangeEvent } from 'react'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { BacktestCard } from '@/features/loss_management/components/BacktestCard'
import { BandCalibrationTable } from '@/features/loss_management/components/BandCalibrationTable'
import { BacktestSeriesTable } from '@/features/loss_management/components/BacktestSeriesTable'
import { SizeComparisonTable } from '@/features/loss_management/components/SizeComparisonTable'
import type { Backtest, BacktestAtSize } from '@/features/loss_management/types/backtestTypes'
import { formatCompetencia } from '@/features/loss_management/utils/backtestFormat'

interface BacktestSeriesViewProps {
  results: Backtest[]
  selected: Backtest | null
  onSelectCutoff: (cutoff: string) => void
  /** Tamanhos de seleção medidos (top N), do menor ao maior. */
  sizes: number[]
  /** Tamanho de seleção em exibição. */
  size: number | null
  onSelectSize: (size: number) => void
  /** O resultado do corte em detalhe em cada tamanho. */
  bySize: BacktestAtSize[]
}

/**
 * Resultado do backtest: a comparação entre todos os cortes, o detalhe de um deles e o efeito do tamanho da seleção.
 *
 * @param props - Resultados por corte, o corte e o tamanho em detalhe e as trocas de corte e de tamanho.
 * @returns Tabela dos cortes, os avisos de como ler a medida e o detalhe (indicadores, tamanhos e calibração por
 * faixa); ou o aviso de que o backtest não foi executado, quando não há histórico de inspeções de campo.
 */
export function BacktestSeriesView({
  results,
  selected,
  onSelectCutoff,
  sizes,
  size,
  onSelectSize,
  bySize
}: BacktestSeriesViewProps) {
  if (selected === null) {
    return (
      <p className="text-muted-foreground text-sm">
        Backtest ainda não executado: não há histórico de inspeções de campo.
      </p>
    )
  }
  return (
    <div className="flex flex-col gap-4">
      <BacktestSeriesTable results={results} selectedCutoff={selected.data_corte} />
      <p className="text-muted-foreground text-xs">
        Leia a precisão junto com o n: ela vale só para as UCs selecionadas que foram inspecionadas na janela, e o
        histórico de campo foi direcionado a UCs com queda de consumo.
      </p>
      <p className="text-muted-foreground text-xs">
        Os cortes cobrem só julho a dezembro de 2025, os meses com inspeções de campo registradas: o comportamento da
        fila no verão (janeiro a março), quando o consumo sobe, não foi medido com inspeções reais. As chances de
        acerto da fila também foram medidas nessas inspeções, então a precisão tende a ser otimista.
      </p>
      <div className="flex flex-wrap gap-4">
        <div className="flex max-w-xs flex-col gap-1.5">
          <Label htmlFor="backtest-corte">Corte em detalhe</Label>
          <Select
            id="backtest-corte"
            value={selected.data_corte ?? ''}
            onChange={(event: ChangeEvent<HTMLSelectElement>) => onSelectCutoff(event.target.value)}
          >
            {results.map((result) =>
              result.data_corte ? (
                <option key={result.data_corte} value={result.data_corte}>
                  {formatCompetencia(result.data_corte)}
                </option>
              ) : null
            )}
          </Select>
        </div>
        {sizes.length > 1 ? (
          <div className="flex max-w-xs flex-col gap-1.5">
            <Label htmlFor="backtest-tamanho">Tamanho da seleção (top N)</Label>
            <Select
              id="backtest-tamanho"
              value={String(size ?? '')}
              onChange={(event: ChangeEvent<HTMLSelectElement>) => onSelectSize(Number(event.target.value))}
            >
              {sizes.map((option) => (
                <option key={option} value={option}>
                  {`Top ${option}`}
                </option>
              ))}
            </Select>
          </div>
        ) : null}
      </div>
      <BacktestCard backtest={selected} />
      {bySize.length > 1 ? (
        <>
          <h3 className="text-sm font-medium">Quantas UCs inspecionar: o que cada tamanho captura</h3>
          <SizeComparisonTable entries={bySize} selectedSize={size} />
          <p className="text-muted-foreground text-xs">
            O top N é comparado com as inspeções de campo dos 3 meses seguintes, e o campo inspecionou mais UCs do que N
            nesse período: a captura é um piso. A precisão cai pouco conforme N cresce, porque a cauda da fila ainda tem
            chance alta.
          </p>
        </>
      ) : null}
      <h3 className="text-sm font-medium">Previsto contra realizado, por faixa de chance</h3>
      <BandCalibrationTable bands={selected.por_faixa} />
      <p className="text-muted-foreground text-xs">
        Energia esperada é a energia a recuperar (10 meses de déficit, a mediana do que o campo recuperou) vezes a chance
        de acerto, só das UCs inspecionadas. Como o multiplicador foi calibrado nestas mesmas inspeções, a razão entre
        recuperada e esperada tende a ficar perto de 1. Faixa sem inspeções fica em branco: não há dado para medir, e a
        rampa de 20% a 30% segue uma suposição.
      </p>
    </div>
  )
}
