import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface ChatInputProps {
  onSend: (text: string) => void
  disabled?: boolean
}

/**
 * Caixa de entrada de texto e envio de comandos do chat analítico.
 *
 * @param props - Callback de envio e indicador de desativação.
 * @returns Componente de formulário com Textarea e botão.
 */
export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [text, setText] = useState('')

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      if (text.trim() && !disabled) {
        onSend(text)
        setText('')
      }
    }
  }

  const handleSubmit = (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (text.trim() && !disabled) {
      onSend(text)
      setText('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 p-3 border-t border-border bg-card">
      <Textarea
        value={text}
        onChange={event => setText(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Pergunte sobre consumo, faturamento, interrupções ou perdas..."
        className="min-h-20 resize-none"
        disabled={disabled}
      />
      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={!text.trim() || disabled} size="sm">
          {disabled ? 'Consultando...' : 'Enviar Pergunta'}
        </Button>
      </div>
    </form>
  )
}
