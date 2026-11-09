import { useState, type JSX } from 'react'
import { ShieldCheck, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  BUSINESS_SUGGESTIONS,
  GUARDRAIL_SUGGESTIONS
} from '@/features/chat/components/empty-state/promptSuggestions'

/**
 * Propriedades para o explorador de sugestões de prompts.
 */
export interface SuggestionsExplorerProps {
  /** Callback executado ao selecionar um prompt sugerido. */
  onSelectPrompt: (prompt: string) => void
}

/**
 * Exibe pílulas interativas com sugestões analíticas e testes de segurança / recusa.
 *
 * @param props - Propriedades com o callback de seleção.
 * @returns Elemento JSX com botões de sugestões categorizadas e alternador de abas.
 */
export function SuggestionsExplorer({ onSelectPrompt }: SuggestionsExplorerProps): JSX.Element {
  const [tab, setTab] = useState<'business' | 'guardrail'>('business')
  const currentList = tab === 'business' ? BUSINESS_SUGGESTIONS : GUARDRAIL_SUGGESTIONS

  return (
    <div className="flex w-full max-w-xl flex-col items-center gap-3">
      <div className="grid w-full grid-cols-2 rounded-md border border-border bg-muted/40 p-1 sm:inline-flex sm:w-auto">
        <Button
          type="button"
          size="sm"
          variant={tab === 'business' ? 'secondary' : 'ghost'}
          onClick={() => setTab('business')}
        >
          <Sparkles className="size-3.5 text-primary" />
          <span className="truncate">Análises do Case</span>
        </Button>
        <Button
          type="button"
          size="sm"
          variant={tab === 'guardrail' ? 'secondary' : 'ghost'}
          onClick={() => setTab('guardrail')}
        >
          <ShieldCheck className="size-3.5 text-warning" />
          <span className="truncate">Testes de Segurança & Recusa</span>
        </Button>
      </div>

      <div className="flex w-full flex-col gap-2">
        {currentList.map(item => {
          const Icon = item.icon
          return (
            <Button
              key={item.prompt}
              type="button"
              variant="outline"
              size="multiline"
              fullWidth
              className="group justify-between text-left"
              onClick={() => onSelectPrompt(item.prompt)}
            >
              <span className="flex min-w-0 flex-1 items-start gap-2 text-left">
                <Icon className="mt-0.5 size-3.5 shrink-0 text-primary" />
                <span className="break-words text-xs leading-snug text-foreground">
                  {item.prompt}
                </span>
              </span>
              {item.badge ? (
                <Badge
                  variant={tab === 'guardrail' ? 'destructive' : 'muted'}
                  className="ml-2 shrink-0 self-start"
                >
                  {item.badge}
                </Badge>
              ) : null}
            </Button>
          )
        })}
      </div>
    </div>
  )
}
