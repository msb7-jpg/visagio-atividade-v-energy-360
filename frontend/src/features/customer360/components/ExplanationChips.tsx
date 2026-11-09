import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip-card'
import type { Explanation } from '@/features/customer360/utils/diagnosisMessages'

interface ExplanationChipsProps {
  explanations: Explanation[]
}

/**
 * Causas possíveis da conta como chips de uma linha; a frase completa abre no tooltip (mouse, teclado ou toque).
 *
 * @param props - Causas encontradas no diagnóstico.
 * @returns Lista de chips, ou nada quando não há outra causa.
 */
export function ExplanationChips({ explanations }: ExplanationChipsProps) {
  if (explanations.length === 0) return null
  return (
    <ul aria-label="Outras explicações para o valor da conta" className="flex flex-wrap gap-2">
      {explanations.map((explanation) => (
        <li key={explanation.label}>
          <Tooltip content={explanation.detail}>
            <Button type="button" variant="outline" size="sm">
              {explanation.label}
              <span className="sr-only">: {explanation.detail}</span>
            </Button>
          </Tooltip>
        </li>
      ))}
    </ul>
  )
}
