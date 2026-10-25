import { BarChart3, Check, Copy, RotateCcw } from 'lucide-react'
import type { JSX } from 'react'
import { Button } from '@/components/ui/button'
import { useCopyToClipboard } from '@/lib/clipboard'

/**
 * Propriedades para a barra de ações rápidas de uma mensagem do assistente.
 */
export interface ChatMessageActionsProps {
  /** Conteúdo textual da mensagem a ser copiado. */
  content?: string
  /** Callback para regerar a resposta com a mesma consulta. */
  onRetry?: () => void
  /** Callback para acionar a geração de gráfico a partir dos dados da mensagem. */
  onGenerateChart?: () => void
  /** Indica se a mensagem já contém um gráfico renderizado. */
  hasChart?: boolean
  /**
   * Indica se o streaming da mensagem ainda está em execução.
   * @defaultValue `false`
   */
  isStreaming?: boolean
}

/**
 * Barra de botões secundários para copiar texto, regenerar resposta ou gerar gráfico.
 *
 * @param props - Propriedades de conteúdo textual e ações disponíveis.
 * @returns Elemento JSX com a barra de botões de ação rápida.
 */
export function ChatMessageActions({
  content = '',
  onRetry,
  onGenerateChart,
  hasChart = false,
  isStreaming = false
}: ChatMessageActionsProps): JSX.Element {
  const [isCopied, copy] = useCopyToClipboard()

  const handleCopy = () => {
    if (content) {
      void copy(content)
    }
  }

  return (
    <div className="flex items-center gap-1.5 pt-1 text-muted-foreground">
      {onRetry ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isStreaming}
          onClick={onRetry}
          title="Tentar novamente / Regenerar resposta"
        >
          <span className="flex items-center gap-1 text-xs">
            <RotateCcw className="size-3" />
            <span>Regenerar</span>
          </span>
        </Button>
      ) : null}

      {onGenerateChart && !hasChart ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isStreaming}
          onClick={onGenerateChart}
          title="Gerar visualização gráfica para esta análise"
        >
          <span className="flex items-center gap-1 text-xs">
            <BarChart3 className="size-3" />
            <span>Gerar Gráfico</span>
          </span>
        </Button>
      ) : null}

      {content ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          title="Copiar resposta"
        >
          {isCopied ? (
            <span className="flex items-center gap-1 text-success text-xs">
              <Check className="size-3" />
              <span>Copiado</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs">
              <Copy className="size-3" />
              <span>Copiar</span>
            </span>
          )}
        </Button>
      ) : null}
    </div>
  )
}
