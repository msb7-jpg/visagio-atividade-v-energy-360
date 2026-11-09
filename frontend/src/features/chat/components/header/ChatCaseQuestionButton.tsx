import { HelpCircle } from 'lucide-react'
import type { JSX } from 'react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CHAT_CASE_QUESTION } from '@/lib/caseQuestions'

/**
 * Botão com popover que exibe a citação oficial do case para o assistente de IA.
 */
export function ChatCaseQuestionButton(): JSX.Element {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Pergunta do Case para o Assistente IA"
          title="Pergunta do Case"
        >
          <HelpCircle className="size-4 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 text-left">
        <div className="flex flex-col gap-2">
          <div className="flex flex-col">
            <span className="text-foreground text-xs font-semibold tracking-wide uppercase">
              {CHAT_CASE_QUESTION.stakeholder}
            </span>
            <span className="text-muted-foreground text-xs">
              {CHAT_CASE_QUESTION.role}
            </span>
          </div>
          <p className="text-foreground border-border border-l-2 pl-3 text-xs leading-relaxed italic">
            {CHAT_CASE_QUESTION.quote}
          </p>
        </div>
      </PopoverContent>
    </Popover>
  )
}
