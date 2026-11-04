import { MessageSquareText } from 'lucide-react'
import { motion } from 'motion/react'
import type { JSX } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ChatWidgetTriggerProps {
  isStreaming: boolean
  positionClass: string
  onOpen: () => void
}

/**
 * Botão fixo no canto da tela que abre o assistente. Um ponto indica que há uma resposta em andamento.
 */
export function ChatWidgetTrigger({
  isStreaming,
  positionClass,
  onOpen
}: ChatWidgetTriggerProps): JSX.Element {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className={cn('fixed z-50 rounded-md shadow-xl', positionClass)}
    >
      <Button
        type="button"
        size="lg"
        onClick={onOpen}
        aria-label="Abrir Assistente V-Energy IA"
        title="Abrir Assistente V-Energy IA"
      >
        <MessageSquareText aria-hidden="true" />
        Assistente
        {isStreaming ? <span aria-hidden="true" data-testid="chat-streaming-indicator" className="bg-brand size-2 rounded-full" /> : null}
      </Button>
    </motion.div>
  )
}
