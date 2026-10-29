import type { JSX } from 'react'
import { AmbientGlow } from '@/components/animations/AmbientGlow'
import { SuggestionsExplorer } from '@/features/chat/components/empty-state/SuggestionsExplorer'

/**
 * Propriedades para a tela de boas-vindas do chat vazio.
 */
export interface ChatEmptyWelcomeProps {
  /** Indica se o modelo está bloqueado para seleção de prompts. */
  isStreaming: boolean
  /** Callback executado ao selecionar um prompt sugerido. */
  onSelectPrompt: (prompt: string) => void
}

/**
 * Componente visual de boas-vindas do chat com aura luminosa e sugestões rápidas.
 *
 * @param props - Propriedades de streaming e callback de prompt.
 * @returns Elemento JSX com a apresentação inicial do assistente.
 */
export function ChatEmptyWelcome({
  isStreaming,
  onSelectPrompt
}: ChatEmptyWelcomeProps): JSX.Element {
  return (
    <div className="relative flex flex-col items-center justify-center overflow-hidden py-6 text-center sm:py-10">
      <AmbientGlow size="sm" />

      <h2 className="relative z-10 mt-3 font-bold text-foreground text-lg tracking-tight">
        Assistente V-Energy IA
      </h2>
      <p className="relative z-10 mt-1 max-w-sm text-muted-foreground text-xs leading-relaxed">
        Consulte consumo, faturamento, interrupções DEC/FEC, perdas comerciais e geração solar
        em linguagem natural com validação e execução em tempo real.
      </p>

      <div
        className={`relative z-10 mt-5 flex flex-wrap justify-center gap-2 ${
          isStreaming ? 'pointer-events-none opacity-50' : ''
        }`}
      >
        <SuggestionsExplorer onSelectPrompt={onSelectPrompt} />
      </div>
    </div>
  )
}
