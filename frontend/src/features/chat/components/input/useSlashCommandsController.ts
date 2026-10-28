import { Trash2, type LucideIcon } from 'lucide-react'
import { useEffect, useRef, useState, type KeyboardEvent, type RefObject } from 'react'
import type { SlashCommandDefinition } from '@/features/chat/types/chat.types'
import { useClickOutside } from '@/lib/useClickOutside'

/**
 * Definição descritiva de cada slash command no menu de sugestão rápida.
 */
export interface SlashCommandItem extends SlashCommandDefinition {
  icon: LucideIcon
}

const AVAILABLE_SLASH_COMMANDS: SlashCommandItem[] = [
  {
    name: '/clear',
    label: '/clear',
    description: 'Limpa o histórico de mensagens da conversa',
    icon: Trash2
  }
]

/**
 * Propriedades de entrada para o controlador de slash commands do input.
 */
export interface UseSlashCommandsControllerOptions {
  /** Callback para submissão da mensagem montada. */
  onSendMessage: (message: string) => void
  /** Indica se o input está bloqueado para interação. */
  isDisabled: boolean
}

/**
 * Objeto com os estados e manipuladores do controlador headless de slash commands.
 */
export interface UseSlashCommandsControllerResult {
  text: string
  activeCommand: string | null
  isMenuOpenExplicit: boolean
  selectedIndex: number
  filteredCommands: SlashCommandItem[]
  showCommandMenu: boolean
  hasContentToSend: boolean
  containerRef: RefObject<HTMLDivElement | null>
  inputRef: RefObject<HTMLInputElement | null>
  registerItemRef: (index: number, element: HTMLDivElement | null) => void
  toggleMenu: () => void
  setSelectedIndex: (index: number) => void
  selectCommand: (commandName: string) => void
  clearActiveCommand: () => void
  handleInputChange: (val: string) => void
  handleKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void
  handleSend: () => void
}

interface MenuNavOpts {
  hasSpace: boolean
  onNext: () => void
  onPrev: () => void
  onSelect: () => void
  onDismiss: () => void
}

function processMenuKeyDown(
  key: string,
  event: KeyboardEvent<HTMLInputElement>,
  opts: MenuNavOpts
): boolean {
  if (key === 'ArrowDown') {
    event.preventDefault()
    opts.onNext()
    return true
  }
  if (key === 'ArrowUp') {
    event.preventDefault()
    opts.onPrev()
    return true
  }
  if (key === 'Tab' || (key === 'Enter' && !opts.hasSpace)) {
    event.preventDefault()
    opts.onSelect()
    return true
  }
  if (key === 'Escape') {
    event.preventDefault()
    opts.onDismiss()
    return true
  }
  return false
}

/**
 * Hook headless que gerencia o ciclo de vida e atalhos de slash commands no chat.
 *
 * @param options - Callbacks e flags de desabilitação.
 * @returns Estados reativos e manipuladores de eventos.
 */
export function useSlashCommandsController({
  onSendMessage,
  isDisabled
}: UseSlashCommandsControllerOptions): UseSlashCommandsControllerResult {
  const [text, setText] = useState('')
  const [activeCommand, setActiveCommand] = useState<string | null>(null)
  const [isMenuOpenExplicit, setIsMenuOpenExplicit] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const itemsRef = useRef<(HTMLDivElement | null)[]>([])

  useClickOutside(containerRef, () => {
    setIsMenuOpenExplicit(false)
  })

  const isCommandTriggered = text.startsWith('/') && !text.includes(' ')
  const filteredCommands = isCommandTriggered
    ? AVAILABLE_SLASH_COMMANDS.filter(cmd => cmd.name.toLowerCase().startsWith(text.toLowerCase()))
    : AVAILABLE_SLASH_COMMANDS

  const showCommandMenu = (isCommandTriggered || isMenuOpenExplicit) && filteredCommands.length > 0 && !isDisabled

  useEffect(() => {
    if (showCommandMenu) {
      const targetElement = itemsRef.current[selectedIndex]
      if (targetElement && typeof targetElement.scrollIntoView === 'function') {
        targetElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    }
  }, [selectedIndex, showCommandMenu])

  const selectCommand = (commandName: string) => {
    setActiveCommand(commandName)
    setText('')
    setIsMenuOpenExplicit(false)
    inputRef.current?.focus()
  }

  const handleInputChange = (val: string) => {
    if (val.startsWith('/') && val.includes(' ')) {
      const [cmdPart, ...rest] = val.split(' ')
      const matched = AVAILABLE_SLASH_COMMANDS.find(
        cmd => cmd.name.toLowerCase() === cmdPart.toLowerCase()
      )
      if (matched) {
        setActiveCommand(matched.name)
        setText(rest.join(' '))
        return
      }
    }
    setText(val)
    setSelectedIndex(0)
  }

  const handleSend = () => {
    const trimmed = text.trim()
    let full = trimmed
    if (activeCommand) {
      full = trimmed ? `${activeCommand} ${trimmed}` : activeCommand
    }
    if (!full || isDisabled) return
    onSendMessage(full)
    setText('')
    setActiveCommand(null)
    setIsMenuOpenExplicit(false)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (showCommandMenu) {
      const handled = processMenuKeyDown(event.key, event, {
        hasSpace: text.trim().includes(' '),
        onNext: () => setSelectedIndex(prev => (prev + 1) % filteredCommands.length),
        onPrev: () => setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length),
        onSelect: () => {
          const chosen = filteredCommands[selectedIndex] || filteredCommands[0]
          if (chosen) selectCommand(chosen.name)
        },
        onDismiss: () => setIsMenuOpenExplicit(false)
      })
      if (handled) return
    }
    if (event.key === 'Backspace' && !text && activeCommand) {
      event.preventDefault()
      setActiveCommand(null)
      return
    }
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSend()
    }
  }

  return {
    text,
    activeCommand,
    isMenuOpenExplicit,
    selectedIndex,
    filteredCommands,
    showCommandMenu,
    hasContentToSend: Boolean(activeCommand || text.trim()),
    containerRef,
    inputRef,
    registerItemRef: (idx, el) => {
      itemsRef.current[idx] = el
    },
    toggleMenu: () => setIsMenuOpenExplicit(prev => !prev),
    setSelectedIndex,
    selectCommand,
    clearActiveCommand: () => setActiveCommand(null),
    handleInputChange,
    handleKeyDown,
    handleSend
  }
}
