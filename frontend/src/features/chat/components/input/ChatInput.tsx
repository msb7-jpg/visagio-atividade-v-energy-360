import { ArrowUp, Pause, Plus } from 'lucide-react'
import type { JSX } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CommandPill } from '@/features/chat/components/input/CommandPill'
import { SlashCommandMenu } from '@/features/chat/components/input/SlashCommandMenu'
import { useSlashCommandsController } from '@/features/chat/components/input/useSlashCommandsController'
import { cn } from '@/lib/utils'

/**
 * Propriedades do campo de entrada de mensagens do chat.
 */
export interface ChatInputProps {
  /** Callback executado ao submeter o texto digitado pelo usuário. */
  onSendMessage: (message: string) => void
  /** Callback executado para interromper e cancelar a transmissão da resposta em andamento. */
  onAbortStream?: () => void
  /** Indica se o assistente está gerando resposta ativamente em streaming. */
  isStreaming: boolean
  /** Bloqueia o input de texto e envio. */
  disabled?: boolean
  /** Classes CSS adicionais. */
  className?: string
}

/**
 * Caixa de texto com suporte a envio via Enter, menu flutuante de slash commands e botão de pausa.
 *
 * @param props - Propriedades de controle e callbacks de envio e aborto.
 * @returns Elemento JSX do campo de texto com comandos rápidos.
 */
export function ChatInput({
  onSendMessage,
  onAbortStream,
  isStreaming,
  disabled = false,
  className
}: ChatInputProps): JSX.Element {
  const isInputDisabled = disabled || isStreaming

  const {
    text,
    activeCommand,
    isMenuOpenExplicit,
    selectedIndex,
    filteredCommands,
    showCommandMenu,
    hasContentToSend,
    containerRef,
    inputRef,
    registerItemRef,
    toggleMenu,
    setSelectedIndex,
    selectCommand,
    clearActiveCommand,
    handleInputChange,
    handleKeyDown,
    handleSend
  } = useSlashCommandsController({
    onSendMessage,
    isDisabled: isInputDisabled
  })

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative rounded-2xl border border-border bg-card/90 p-2 shadow-xl backdrop-blur-xl transition-all focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50',
        className
      )}
    >
      {showCommandMenu ? (
        <SlashCommandMenu
          commands={filteredCommands}
          selectedIndex={selectedIndex}
          onRegisterItemRef={registerItemRef}
          onSelectCommand={selectCommand}
          onHoverIndex={setSelectedIndex}
        />
      ) : null}

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={isInputDisabled}
          onClick={toggleMenu}
          aria-label="Abrir comandos rápidos"
        >
          <Plus
            className={cn(
              'size-4 text-muted-foreground transition-transform duration-200',
              isMenuOpenExplicit ? 'rotate-45 text-primary' : null
            )}
          />
        </Button>

        {activeCommand ? (
          <CommandPill command={activeCommand} onRemove={clearActiveCommand} />
        ) : null}

        <div className="min-w-0 flex-1">
          <Input
            ref={inputRef}
            type="text"
            variant="embedded"
            value={text}
            onChange={event => handleInputChange(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              activeCommand
                ? 'Digite a pergunta ou parâmetros do comando...'
                : 'Faça uma pergunta sobre a rede ou digite + para comandos...'
            }
            disabled={isInputDisabled}
          />
        </div>

        {isStreaming ? (
          <Button
            type="button"
            size="icon"
            variant="destructive"
            onClick={onAbortStream}
            aria-label="Cancelar geração"
          >
            <Pause className="size-4 fill-current" />
          </Button>
        ) : (
          <Button
            type="button"
            size="icon"
            onClick={handleSend}
            disabled={!hasContentToSend || isInputDisabled}
            aria-label="Enviar mensagem"
          >
            <ArrowUp className="size-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
