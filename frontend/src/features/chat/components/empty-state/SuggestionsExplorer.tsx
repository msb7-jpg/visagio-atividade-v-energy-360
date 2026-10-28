import { Activity, BarChart2, ShieldAlert, Sun, Zap } from 'lucide-react'
import type { JSX } from 'react'
import { Button } from '@/components/ui/button'

interface PromptSuggestion {
  category: string
  prompt: string
  icon: typeof Zap
}

const PROMPT_SUGGESTIONS: PromptSuggestion[] = [
  {
    category: 'Medição',
    prompt: 'Qual a média de consumo em kWh por classe residencial?',
    icon: Zap
  },
  {
    category: 'Faturamento',
    prompt: 'Qual o volume total faturado no último mês?',
    icon: BarChart2
  },
  {
    category: 'Qualidade DEC/FEC',
    prompt: 'Quais os 5 alimentadores com maior DEC acumulado?',
    icon: Activity
  },
  {
    category: 'Perdas & Fraude',
    prompt: 'Quantas unidades em Olinda possuem suspeita de fraude?',
    icon: ShieldAlert
  },
  {
    category: 'Solar GD',
    prompt: 'Quantas unidades consumidoras possuem geração solar?',
    icon: Sun
  }
]

/**
 * Propriedades para o explorador de sugestões de prompts.
 */
export interface SuggestionsExplorerProps {
  /** Callback executado ao selecionar um prompt sugerido. */
  onSelectPrompt: (prompt: string) => void
}

/**
 * Exibe pílulas interativas com sugestões de consultas analíticas para o setor elétrico.
 *
 * @param props - Propriedades com o callback de seleção.
 * @returns Elemento JSX com botões de sugestões categorizadas.
 */
export function SuggestionsExplorer({ onSelectPrompt }: SuggestionsExplorerProps): JSX.Element {
  return (
    <div className="flex max-w-2xl flex-wrap justify-center gap-2">
      {PROMPT_SUGGESTIONS.map(item => {
        const Icon = item.icon
        return (
          <Button
            key={item.category}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onSelectPrompt(item.prompt)}
          >
            <span className="flex items-center gap-1.5 text-xs">
              <Icon className="size-3.5 text-primary" />
              <span className="truncate">{item.prompt}</span>
            </span>
          </Button>
        )
      })}
    </div>
  )
}
