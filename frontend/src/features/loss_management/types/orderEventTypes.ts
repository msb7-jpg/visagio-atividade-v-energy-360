export interface OrderEvent {
  id_evento: number
  id_inspecao: number
  tipo: string
  status_anterior: string | null
  status_novo: string | null
  autor: string
  /** Por campo alterado: [valor antes, valor depois]. */
  alteracoes: Record<string, [unknown, unknown]>
  criado_em: string
}
