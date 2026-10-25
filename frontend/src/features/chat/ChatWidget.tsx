import { AnimatePresence, motion, useDragControls, type MotionStyle } from 'motion/react'
import { useState, type JSX } from 'react'
import { createPortal } from 'react-dom'
import { ChatContainer } from '@/features/chat/ChatContainer'
import { ChatWidgetHeader } from '@/features/chat/components/header/ChatWidgetHeader'
import { ChatWidgetTrigger } from '@/features/chat/components/header/ChatWidgetTrigger'
import { ResizeHandles } from '@/features/chat/components/header/ResizeHandles'
import { useAgentStream } from '@/features/chat/hooks/useAgentStream'
import { useFloatingWidgetDragResize } from '@/features/chat/hooks/useFloatingWidgetDragResize'
import { useSmartSnap } from '@/features/chat/hooks/useSmartSnap'
import { cn } from '@/lib/utils'

/**
 * Posições suportadas no viewport para o botão flutuante e o painel de chat.
 */
export type ChatWidgetPosition = 'bottom-left' | 'bottom-right'

/**
 * Propriedades para o widget flutuante global de chat.
 */
export interface ChatWidgetProps {
  /**
   * Posição do botão flutuante e painel de chat no viewport.
   * @defaultValue 'bottom-right'
   */
  position?: ChatWidgetPosition
  /** Classes CSS adicionais. */
  className?: string
}

/**
 * Botão flutuante circular que expande para chat analítico arrastável e redimensionável com smart snap.
 *
 * @param props - Propriedades de posicionamento e estilização.
 * @returns Elemento JSX do widget renderizado via Portal.
 */
export function ChatWidget({
  position = 'bottom-right',
  className
}: ChatWidgetProps): JSX.Element | null {
  const [isOpen, setIsOpen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const dragControls = useDragControls()
  const { messages, isStreaming, sendMessage, stopStreaming, clearMessages } = useAgentStream()
  const { size, onResizeStart, resetSize } = useFloatingWidgetDragResize(isFullscreen)
  const { scope, dragConstraints, handleDragEnd, resetPosition } = useSmartSnap({
    width: size.width,
    height: size.height,
    baseAnchor: position,
    isFullscreen
  })

  const handleToggleFullscreen = () => {
    setIsFullscreen(prev => !prev)
    resetSize()
    resetPosition()
  }

  const handleClose = () => {
    setIsOpen(false)
    setIsFullscreen(false)
    resetSize()
    resetPosition()
  }

  if (typeof document === 'undefined') {
    return null
  }

  const positionClass = position === 'bottom-left' ? 'left-6 bottom-6' : 'right-6 bottom-6'

  return createPortal(
    <div className={cn('relative', className)}>
      <AnimatePresence>
        {!isOpen ? (
          <ChatWidgetTrigger
            key="chat-trigger"
            isStreaming={isStreaming}
            positionClass={positionClass}
            onOpen={() => setIsOpen(true)}
          />
        ) : (
          <motion.div
            key="chat-panel"
            ref={scope}
            drag={!isFullscreen}
            dragListener={false}
            dragControls={dragControls}
            dragMomentum={false}
            dragConstraints={dragConstraints}
            onDragEnd={handleDragEnd}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            style={
              isFullscreen
                ? undefined
                : ({
                  '--widget-w': `${size.width}px`,
                  '--widget-h': `${size.height}px`
                } as unknown as MotionStyle)
            }
            className={cn(
              'fixed z-50 flex flex-col overflow-hidden bg-card/95 shadow-2xl backdrop-blur-2xl transition-shadow duration-300',
              isFullscreen
                ? 'inset-0 h-screen min-h-dvh w-screen rounded-none border-0'
                : cn('chat-widget-resizable rounded-2xl border border-border', positionClass)
            )}
          >
            {!isFullscreen ? <ResizeHandles onResizeStart={onResizeStart} /> : null}

            <ChatWidgetHeader
              isStreaming={isStreaming}
              isFullscreen={isFullscreen}
              hasMessages={messages.length > 0}
              onPointerDownDrag={event => dragControls.start(event)}
              onToggleFullscreen={handleToggleFullscreen}
              onClear={clearMessages}
              onClose={handleClose}
            />

            <div className="flex-1 overflow-hidden">
              <ChatContainer
                messages={messages}
                isStreaming={isStreaming}
                onSendMessage={msg => void sendMessage(msg)}
                onAbortStream={stopStreaming}
                onClear={clearMessages}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>,
    document.body
  )
}
