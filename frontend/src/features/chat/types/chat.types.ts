export const MESSAGE_ROLE = {
  USER: 'user',
  ASSISTANT: 'assistant'
} as const

export type MessageRole = (typeof MESSAGE_ROLE)[keyof typeof MESSAGE_ROLE]

export const STEP_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  DONE: 'done',
  ERROR: 'error'
} as const

export type StepperNodeStatus = (typeof STEP_STATUS)[keyof typeof STEP_STATUS]

export interface AgentStepItem {
  step: string
  label: string
  status: StepperNodeStatus
  duration_ms?: number
}

export interface ChartDataset {
  label: string
  data: number[]
}

export interface ChartDataPayload {
  labels: string[]
  datasets: ChartDataset[]
}

export interface ChartSpec {
  chart_type: 'bar' | 'line' | 'pie' | 'doughnut'
  title: string
  description?: string
  data: ChartDataPayload
}

export interface SlashCommandDefinition {
  name: string
  label: string
  description: string
}

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  thought?: string | null
  sql?: string | null
  data?: Record<string, unknown>[] | null
  chart?: ChartSpec | null
  error?: string | null
  steps?: AgentStepItem[]
  duration_ms?: number
  row_count?: number
  timestamp: string
  isStreaming?: boolean
}
