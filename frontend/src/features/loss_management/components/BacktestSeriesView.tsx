import type { ChangeEvent } from 'react'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { BacktestCard } from '@/features/loss_management/components/BacktestCard'
import { BandCalibrationTable } from '@/features/loss_management/components/BandCalibrationTable'
import { BacktestSeriesTable } from '@/features/loss_management/components/BacktestSeriesTable'
import type { Backtest } from '@/features/loss_management/types/backtestTypes'
import { formatCompetencia } from '@/features/loss_management/utils/backtestFormat'

interface BacktestSeriesViewProps {
  results: Backtest[]
  selected: Backtest | null
  onSelectCutoff: (cutoff: string) => void
}

/**
 * Resultado do backtest: a comparação entre todos os cortes e o detalhe de um deles.
 *
 * @param props - Resultados por corte, o corte em detalhe e a troca de corte.
 * @returns Tabela dos cortes, o aviso de como ler a precisão e o detalhe (indicadores e taxa por motivo); ou o
 * aviso de que o backtest não foi executado, quando não há histórico de inspeções de campo.
 */
export function BacktestSeriesView({ results, selected, onSelectCutoff }: BacktestSeriesViewProps) {
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
      <BacktestCard backtest={selected} />
      <h3 className="text-sm font-medium">Previsto contra realizado, por faixa de chance</h3>
      <BandCalibrationTable bands={selected.por_faixa} />
      <p className="text-muted-foreground text-xs">
        Energia esperada é a energia a recuperar (3 meses de déficit) vezes a chance de acerto, só das UCs inspecionadas.
        Recuperada bem acima da esperada indica que a estimativa é conservadora. Faixa sem inspeções fica em branco: não
        há dado para medir, e a rampa de 20% a 30% segue uma suposição.
      </p>
    </div>
  )
}
