import type { SuspicionReason } from '@/features/loss_management/types/lossTypes'

export interface ReasonBacktest {
  motivo: SuspicionReason
  inspecionadas: number
  irregulares: number
  taxa: number | null
  amostra_suficiente: boolean
}

/** Faixa da chance de acerto prevista: patamar alto (90% ou mais), rampa sem medição ou patamar baixo (10% ou menos). */
export type ChanceBand = 'alta' | 'rampa' | 'baixa'

/** O previsto e o realizado das UCs selecionadas de uma faixa de chance. */
export interface BandBacktest {
  faixa: ChanceBand
  selecionadas: number
  inspecionadas: number
  irregulares: number
  /** Acerto observado: irregulares ÷ inspecionadas; nulo sem inspeções. */
  taxa: number | null
  /** Chance de acerto média que o modelo deu às inspecionadas; nula sem inspeções. */
  chance_prevista: number | null
  /** Energia a recuperar × chance de acerto, somada nas inspecionadas. */
  kwh_esperado: number
  kwh_recuperado: number
}

export interface Backtest {
  backtest_executado: boolean
  cortes_disponiveis: string[]
  data_corte: string | null
  janela_resultado_inicio: string | null
  janela_resultado_fim: string | null
  n_solicitado: number
  n_selecionadas: number
  n_inspecionadas: number
  n_irregulares: number
  precisao_selecao: number | null
  inspecoes_janela: number
  linha_base: number | null
  diferenca_pp: number | null
  kwh_recuperado: number
  por_motivo: ReasonBacktest[]
  amostra_minima_por_motivo: number
  /** Energia que o modelo esperava recuperar nas selecionadas que foram inspecionadas. */
  kwh_esperado: number
  /** Chance de acerto média das selecionadas inspecionadas; compare com a precisão. */
  chance_media_prevista: number | null
  /** UCs com irregularidade confirmada pelo campo na janela, estivessem ou não na fila. */
  irregulares_janela: number
  /** Dessas, as que a fila inteira do corte continha (não só o top N). */
  irregulares_na_fila: number
  por_faixa: BandBacktest[]
}

export interface BacktestSeries {
  tamanho: number
  cortes: Backtest[]
}
