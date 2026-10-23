import { Info } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import type { QueueWarning, QueueWarningCode } from '@/features/loss_management/types/lossTypes'

const WARNING_TITLES: Record<QueueWarningCode, string> = {
  historico_campo_nao_aplicado: 'Histórico de inspeções de campo não aplicado.',
  competencia_referencia_fixada: 'Competência de referência fixada.'
}

// Código novo no backend ainda sem título no frontend: o tipo é copiado à mão, então não há garantia em runtime.
const FALLBACK_TITLE = 'Aviso sobre a fila.'

interface QueueWarningsProps {
  warnings: QueueWarning[]
}

/**
 * Avisos de degradação da análise, exibidos acima da fila sem escondê-la.
 *
 * @param props - Avisos devolvidos pela API junto com a fila.
 * @returns Um alerta por aviso, ou nada quando a análise está completa.
 */
export function QueueWarnings({ warnings }: QueueWarningsProps) {
  return warnings.map((warning) => (
    <Alert key={warning.codigo} variant="warning">
      <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div>
        <AlertTitle>{WARNING_TITLES[warning.codigo] ?? FALLBACK_TITLE}</AlertTitle>
        <AlertDescription>{warning.mensagem}</AlertDescription>
      </div>
    </Alert>
  ))
}
