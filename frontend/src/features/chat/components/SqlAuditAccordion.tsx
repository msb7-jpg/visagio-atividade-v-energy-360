import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface SqlAuditAccordionProps {
  sql?: string | null
  durationMs?: number
}

/**
 * Sanfona de auditoria técnica para inspeção do SQL gerado e telemetria de execução.
 *
 * @param props - Propriedades com a query SQL e duração em ms.
 * @returns Componente de auditoria com botão de alternância.
 */
export function SqlAuditAccordion({ sql, durationMs }: SqlAuditAccordionProps) {
  const [isOpen, setIsOpen] = useState(false)

  if (!sql) return null

  return (
    <div className="mt-2 rounded-xl border border-border bg-muted/40 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Auditoria SQL
          </span>
          {durationMs !== undefined ? (
            <span className="rounded-md bg-secondary px-1.5 py-0.5 text-xs font-mono text-secondary-foreground">
              {durationMs}ms
            </span>
          ) : null}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(prev => !prev)}
        >
          {isOpen ? 'Ocultar Query' : 'Ver Query SQL'}
        </Button>
      </div>

      {isOpen ? (
        <pre className="mt-2 max-h-48 overflow-x-auto rounded-lg bg-card p-2.5 font-mono text-xs text-foreground border border-border">
          <code>{sql}</code>
        </pre>
      ) : null}
    </div>
  )
}
