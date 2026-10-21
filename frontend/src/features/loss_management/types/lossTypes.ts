/** Ciclo de vida da ordem: gerada, depois pendente (em campo), depois concluida; cancelada a partir de gerada/pendente. */
export type InspectionStatus = 'gerada' | 'pendente' | 'concluida' | 'cancelada'

/** Motivos de suspeita calculados pelo backend. */
export type SuspicionReason = 'queda_subita' | 'leitura_zerada'

/** UC da fila de suspeitas (`GET /losses/suspicious-units`). */
export interface SuspiciousUnit {
  id_uc: string
  municipio: string | null
  bairro: string | null
  classe_consumo: string | null
  motivos: SuspicionReason[]
  score_risco: number
  consumo_base_kwh: number
  consumo_recente_kwh: number
  kwh_estimado_recuperar: number
  valor_estimado_recuperar_rs: number
}

/** Filtros opcionais da fila de suspeitas. */
export interface SuspiciousUnitsFilter {
  municipio?: string
  bairro?: string
  classe?: string
}

/** Ordem de inspeção (`GET /losses/inspections`). */
export interface InspectionOrder {
  id_inspecao: number
  id_uc: string
  status: InspectionStatus
  motivo: string | null
  kwh_estimado: number
  fiscal_responsavel: string | null
  irregularidade_constatada: boolean | null
  tipo_irregularidade: string | null
  kwh_recuperado: number | null
  numero_toi: string | null
  justificativa_cancelamento: string | null
  criado_por: string
  criado_em: string
  atualizado_em: string
}

/** Payload de abertura de ordem a partir da fila (o kWh estimado é calculado pelo servidor). */
export interface InspectionOrderCreate {
  id_uc: string
  motivo?: string
}

/** Payload de mudança de status, resultado de campo ou cancelamento. */
export interface InspectionOrderUpdate {
  status: InspectionStatus
  fiscal_responsavel?: string
  irregularidade_constatada?: boolean
  tipo_irregularidade?: string
  kwh_recuperado?: number
  numero_toi?: string
  justificativa_cancelamento?: string
}
