import { HelpCircle } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CASE_QUESTIONS_BY_PATH } from '@/lib/caseQuestions'

/**
 * Botão discreto com popover que exibe a pergunta/citação exata do case da V-Energy
 * correspondente à tela ativa. Serve como guia durante a apresentação para a banca.
 */
export function CaseQuestionButton() {
  const { pathname } = useLocation()
  const questionItem = CASE_QUESTIONS_BY_PATH[pathname]

  if (!questionItem) {
    return null
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          aria-label="Pergunta do Case"
        >
          <HelpCircle aria-hidden="true" />
          <span className="hidden sm:inline">Pergunta do Case</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 text-left">
        <div className="flex flex-col gap-2">
          <div className="flex flex-col">
            <span className="text-foreground text-xs font-semibold tracking-wide uppercase">
              {questionItem.stakeholder}
            </span>
            <span className="text-muted-foreground text-xs">
              {questionItem.role}
            </span>
          </div>
          <p className="text-foreground border-border border-l-2 pl-3 text-xs leading-relaxed italic">
            {questionItem.quote}
          </p>
        </div>
      </PopoverContent>
    </Popover>
  )
}
