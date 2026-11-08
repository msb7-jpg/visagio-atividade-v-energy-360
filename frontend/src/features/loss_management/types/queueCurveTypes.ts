/** Retorno esperado somado das primeiras `posicao` UCs livres da fila (`GET /losses/queue-curve`). */
export interface ReturnCurvePoint {
  posicao: number
  /** Soma de energia recuperável × chance de acerto, em kWh/mês. */
  kwh_mes_acumulado: number
  /** A mesma soma em R$/ano, pela tarifa de referência. */
  valor_ano_acumulado_rs: number
}

/** Curva de retorno acumulado e o corte sugerido para o custo de inspeção informado. */
export interface ReturnCurve {
  /** UCs livres na fila, sem ordem ativa. */
  total_ucs: number
  tarifa_rs_kwh: number | null
  /** Custo por inspeção enviado na consulta; nulo sem custo. */
  custo_inspecao_rs: number | null
  /** Quantas UCs inspecionar enquanto o R$/ano esperado de cada uma cobre o custo; nulo sem custo. */
  corte_sugerido: number | null
  pontos: ReturnCurvePoint[]
}
