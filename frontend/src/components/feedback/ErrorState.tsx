import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type CopyStatus = 'idle' | 'copied' | 'failed'

const COPY_LABELS: Record<CopyStatus, string> = {
  idle: 'Copiar detalhes para o suporte',
  copied: 'Detalhes copiados',
  failed: 'Não foi possível copiar'
}

interface ErrorStateProps {
  title: string
  description?: string
  detail?: string
  onRetry?: () => void
  scope?: 'block' | 'page'
}

/**
 * Falha ao carregar um bloco: as demais áreas da tela continuam funcionando.
 * `detail` é a linha técnica (rota, código, id da requisição) que o usuário pode copiar para o suporte.
 *
 * @param props - Texto do erro, detalhe técnico, ação de nova tentativa e escopo (`page` ocupa a área de conteúdo).
 * @returns Cartão de erro com ações opcionais.
 */
export function ErrorState({ title, description, detail, onRetry, scope = 'block' }: ErrorStateProps) {
  const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle')

  const copyDetail = async () => {
    try {
      await navigator.clipboard.writeText(detail ?? '')
      setCopyStatus('copied')
    } catch {
      setCopyStatus('failed')
    }
  }

  return (
    <div
      role="alert"
      className={cn(
        'border-border bg-card flex flex-col gap-3 rounded-lg border p-4',
        scope === 'page' ? 'min-h-72 justify-center' : null
      )}
    >
      <div className="flex items-start gap-2.5">
        <AlertTriangle aria-hidden="true" className="text-destructive mt-0.5 size-5 shrink-0" />
        <div className="flex flex-col gap-0.5">
          <h3 className="text-foreground text-lg font-bold">{title}</h3>
          {description ? <p className="text-muted-foreground text-sm">{description}</p> : null}
        </div>
      </div>
      {detail ? (
        <p className="bg-muted text-muted-foreground rounded-md px-3 py-2 font-mono text-xs">{detail}</p>
      ) : null}
      {onRetry || detail ? (
        <div className="flex flex-wrap gap-2">
          {onRetry ? <Button size="sm" onClick={onRetry}>Tentar novamente</Button> : null}
          {detail ? (
            <Button variant="outline" size="sm" onClick={copyDetail}>{COPY_LABELS[copyStatus]}</Button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
