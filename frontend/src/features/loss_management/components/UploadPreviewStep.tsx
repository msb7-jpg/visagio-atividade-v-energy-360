import { Button } from '@/components/ui/button'
import { DialogFooter } from '@/components/ui/dialog'
import { UploadResultSummary } from '@/features/loss_management/components/UploadResultSummary'
import type { UploadResult } from '@/features/loss_management/types/lossTypes'

interface UploadPreviewStepProps {
  preview: UploadResult
  isImporting: boolean
  errorMessage: string | null
  onBack: () => void
  onImport: () => void
}

/**
 * Etapa de conferência do upload: o que seria importado e o que seria recusado, antes de gravar qualquer ordem.
 *
 * @param props - Resultado da pré-visualização, estado da importação e callbacks.
 * @returns Resumo com "Cancelar" e "Importar N linhas válidas" (desabilitado sem linha válida).
 */
export function UploadPreviewStep({ preview, isImporting, errorMessage, onBack, onImport }: UploadPreviewStepProps) {
  const label = preview.conciliadas === 1 ? 'linha válida' : 'linhas válidas'

  return (
    <>
      <UploadResultSummary result={preview} />
      {errorMessage ? <p className="text-destructive text-sm" role="alert">{errorMessage}</p> : null}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onBack}>Cancelar</Button>
        <Button
          type="button"
          disabled={preview.conciliadas < 1 || isImporting}
          aria-busy={isImporting}
          onClick={onImport}
        >
          Importar {preview.conciliadas} {label}
        </Button>
      </DialogFooter>
    </>
  )
}
