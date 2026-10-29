import type { QueueSituation, SuspicionReason } from '@/features/loss_management/types/lossTypes'

/** Consumo de uma competência; `consumo_kwh` nulo = mês sem leitura válida (lacuna no gráfico, nunca zero). */
export interface MonthlyConsumption {
  /** Competência no formato 'YYYY-MM'. */
  competencia: string
  consumo_kwh: number | null
}

/** De onde vem a inspeção anterior: histórico de campo (Gold) ou ordem concluída no portal. */
export type PriorInspectionSource = 'historico_campo' | 'ordem_portal'

export interface PriorInspection {
  origem: PriorInspectionSource
  /** AAAA-MM-DD; nula quando a ordem concluída não registrou a data. */
  data_inspecao: string | null
  irregularidade_constatada: boolean | null
  /** Código INSP-001 a INSP-040. */
  inspetor: string | null
}

/** A conta do score: kWh recuperável x chance de acerto = kWh esperado; score = esperado / topo da fila. */
export interface ScoreBreakdown {
  kwh_mes_recuperavel: number
  meses_janela_recuperacao: number
  kwh_janela_recuperavel: number
  probabilidade_acerto: number
  kwh_esperado: number
  maior_kwh_esperado_fila: number
  score: number
}

/** Resposta de `GET /losses/suspicious-units/{id_uc}`. */
export interface UnitDetail {
  id_uc: string
  municipio: string | null
  bairro: string | null
  classe_consumo: string | null
  situacao: QueueSituation
  competencia_referencia: string
  motivos: SuspicionReason[]
  /** Frase calculada por regra a partir dos números da UC (não é gerada por modelo de IA). */
  motivo_resumo: string
  consumo_base_kwh: number
  consumo_recente_kwh: number
  decomposicao_score: ScoreBreakdown
  /** 12 competências em ordem crescente, terminando na de referência. */
  consumo_mensal: MonthlyConsumption[]
  /** Da mais recente para a mais antiga. */
  inspecoes_anteriores: PriorInspection[]
}
