import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet'
import { ChatInput } from '@/features/chat/components/ChatInput'
import { ChatMessageBubble } from '@/features/chat/components/ChatMessageBubble'
import { useAgentStream } from '@/features/chat/hooks/useAgentStream'

/**
 * Gaveta lateral global expansível para interação com o Agente Text-to-SQL.
 *
 * @returns Componente Sheet contendo o fluxo completo de mensagens e input.
 */
export function ChatDrawer() {
  const { messages, isStreaming, sendMessage, clearMessages } = useAgentStream()

  return (
    <Sheet>
      <SheetTrigger render={<Button variant="default" size="sm">Assistente IA</Button>} />

      <SheetContent side="right">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle>Assistente V-Energy IA</SheetTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">Modo Seguro (Read-Only)</Badge>
              </div>
            </div>
            {messages.length > 0 ? (
              <Button variant="ghost" size="sm" onClick={clearMessages}>
                Limpar
              </Button>
            ) : null}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center p-6 text-muted-foreground">
              <p className="font-semibold text-foreground text-sm">Como posso ajudar hoje?</p>
              <p className="mt-1 text-xs">
                Pergunte sobre consumo, faturamento, histórico de DEC/FEC ou perdas comerciais na concessão.
              </p>
            </div>
          ) : (
            messages.map(msg => <ChatMessageBubble key={msg.id} message={msg} />)
          )}
        </div>

        <ChatInput onSend={sendMessage} disabled={isStreaming} />
      </SheetContent>
    </Sheet>
  )
}
