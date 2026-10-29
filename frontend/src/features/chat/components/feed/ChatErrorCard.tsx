import { AlertCircle, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react'
import { useState, type JSX } from 'react'
import { Button } from '@/components/ui/button'

/**
 * Propriedades para renderização do card de erro de processamento analítico.
 */
export interface ChatErrorCardProps {
  /** Mensagem principal ou descrição do erro. */
  message: string
  /** Detalhes técnicos opcionais ou stack trace. */
  details?: string | null
  /** Callback para nova tentativa de envio. */
  onRetry?: () => void
}

/**
 * Card destacado para apresentação de falhas de processamento, validação SQL ou erros de rede.
 *
 * @param props - Propriedades contendo os dados do erro e opções de recuperação.
 * @returns Elemento JSX com mensagem de erro e detalhes técnicos expansíveis.
 */
export function ChatErrorCard({
  message,
  details,
  onRetry
}: ChatErrorCardProps): JSX.Element {
  const [showDetails, setShowDetails] = useState(false)

  return (
    <div
      data-testid="chat-error-card"
      className="space-y-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-destructive/20 text-destructive">
          <AlertCircle className="size-4" />
        </div>
        <div className="flex-1 space-y-1">
          <h4 className="text-xs font-semibold tracking-wide text-foreground">
            Falha no Processamento
          </h4>
          <p className="text-xs leading-relaxed text-muted-foreground">{message}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-destructive/15 pt-1">
        {onRetry ? (
          <Button type="button" variant="default" size="sm" onClick={onRetry}>
            <span className="flex items-center gap-1.5 text-xs">
              <RotateCcw className="size-3.5" />
              <span>Tentar Novamente</span>
            </span>
          </Button>
        ) : null}

        {details && details !== message ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(prev => !prev)}
          >
            {showDetails ? (
              <span className="flex items-center gap-1 text-xs">
                <ChevronUp className="size-3.5" />
                <span>Ocultar detalhes</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs">
                <ChevronDown className="size-3.5" />
                <span>Ver detalhes técnicos</span>
              </span>
            )}
          </Button>
        ) : null}
      </div>

      {showDetails && details ? (
        <pre className="max-h-40 overflow-x-auto break-all rounded-lg border border-border bg-card p-2.5 font-mono text-xs whitespace-pre-wrap text-muted-foreground">
          {details}
        </pre>
      ) : null}
    </div>
  )
}
