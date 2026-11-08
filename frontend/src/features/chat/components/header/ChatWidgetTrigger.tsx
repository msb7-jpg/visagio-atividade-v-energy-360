import { motion } from 'motion/react'
import type { JSX } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ChatWidgetTriggerProps {
  isStreaming: boolean
  positionClass: string
  onOpen: () => void
}

/** Estrela de quatro pontas (estilo Gemini), preenchida com a cor do texto. */
const SPARKLE_PATH = 'M12 0C12.6 6.6 17.4 11.4 24 12C17.4 12.6 12.6 17.4 12 24C11.4 17.4 6.6 12.6 0 12C6.6 11.4 11.4 6.6 12 0Z'

/**
 * Bola fixa no canto da tela, com uma estrela de quatro pontas, que abre o assistente.
 * Um ponto indica que há uma resposta em andamento.
 */
export function ChatWidgetTrigger({
  isStreaming,
  positionClass,
  onOpen
}: ChatWidgetTriggerProps): JSX.Element {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.94 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className={cn(
        'group fixed z-50 rounded-full shadow-xl transition-shadow duration-200 hover:shadow-2xl hover:ring-4 hover:ring-brand/30',
        positionClass
      )}
    >
      <div className="overflow-hidden rounded-full">
        <Button
          type="button"
          variant="brand"
          size="iconLg"
          onClick={onOpen}
          aria-label="Abrir Assistente V-Energy IA"
          title="Abrir Assistente V-Energy IA"
        >
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
            className="transition-transform duration-500 ease-out group-hover:rotate-90 group-hover:scale-110"
          >
            <path d={SPARKLE_PATH} />
          </svg>
        </Button>
      </div>
      {isStreaming ? (
        <span
          aria-hidden="true"
          data-testid="chat-streaming-indicator"
          className="bg-brand ring-background absolute -top-0.5 -right-0.5 size-2.5 rounded-full ring-2"
        />
      ) : null}
    </motion.div>
  )
}
