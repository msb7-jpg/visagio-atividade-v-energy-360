// fallow-ignore-file unused-file
import type { JSX } from 'react'
import { NodeStepper } from '@/features/chat/components/feed/NodeStepper'
import type { AgentStepItem } from '@/features/chat/types/chat.types'

/**
 * Propriedades para o componente legado de progresso de etapas.
 */
export interface AgentStepProgressProps {
  /** Lista de etapas de execução. */
  steps?: AgentStepItem[]
}

/**
 * Renderizador de progresso de etapas compatível com NodeStepper.
 *
 * @param props - Propriedades com a lista de etapas.
 * @returns Elemento JSX do NodeStepper.
 */
export function AgentStepProgress({ steps = [] }: AgentStepProgressProps): JSX.Element | null {
  return <NodeStepper steps={steps} />
}
