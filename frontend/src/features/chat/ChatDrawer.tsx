import type { JSX } from 'react'
import { ChatWidget, type ChatWidgetPosition } from '@/features/chat/ChatWidget'

/**
 * Propriedades do componente de entrada ChatDrawer.
 */
export interface ChatDrawerProps {
  /**
   * Posição do botão flutuante e do painel de chat no viewport.
   * @defaultValue 'bottom-right'
   */
  position?: ChatWidgetPosition
  /** Classes CSS adicionais. */
  className?: string
}

/**
 * Ponto de entrada do assistente IA corporativo do V-Energy Grid 360.
 * Renderiza o botão circular flutuante com expansão para chat e tela cheia via Portal.
 *
 * @param props - Propriedades de posicionamento e customização.
 * @returns Elemento JSX do ChatWidget.
 */
export function ChatDrawer({
  position = 'bottom-right',
  className
}: ChatDrawerProps): JSX.Element | null {
  return <ChatWidget position={position} className={className} />
}
