import { Sparkles } from 'lucide-react'
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
 * Botão flutuante circular de acionamento do assistente de IA.
 */
export function ChatWidgetTrigger({
  isStreaming,
  positionClass,
  onOpen
}: ChatWidgetTriggerProps): JSX.Element {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      className={cn('fixed z-50', positionClass)}
    >
      <div className="relative">
        {isStreaming ? (
          <span className="pointer-events-none absolute -inset-1 animate-ping rounded-full bg-primary/40 opacity-75" />
        ) : null}
        <div className="flex size-14 items-center justify-center rounded-full border border-primary/40 bg-primary text-primary-foreground shadow-2xl transition-transform hover:scale-105 active:scale-95">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onOpen}
            aria-label="Abrir Assistente V-Energy IA"
            title="Abrir Assistente V-Energy IA"
          >
            <Sparkles className="size-6 text-primary-foreground" />
            <span className="sr-only">Assistente IA</span>
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
