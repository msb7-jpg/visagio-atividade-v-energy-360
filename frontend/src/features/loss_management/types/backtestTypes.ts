import type { SuspicionReason } from '@/features/loss_management/types/lossTypes'

export interface ReasonBacktest {
  motivo: SuspicionReason
  inspecionadas: number
  irregulares: number
  taxa: number | null
  amostra_suficiente: boolean
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
}

export interface BacktestSeries {
  tamanho: number
  cortes: Backtest[]
}
