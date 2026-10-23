import { Button } from '@/components/ui/button'
import { DialogFooter } from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/spinner'

interface ActionDialogFooterProps {
  confirmLabel: string
  isPending: boolean
  isConfirmDisabled?: boolean
  errorMessage: string | null
  onCancel: () => void
  onConfirm: () => void
}

/**
 * Rodapé padrão dos diálogos de ação: erro da API, voltar e confirmar com travamento.
 *
 * @param props - Rótulo, estado da mutação e callbacks.
 * @returns Rodapé com botões e mensagem de erro opcional.
 */
export function ActionDialogFooter({
  confirmLabel,
  isPending,
  isConfirmDisabled = false,
  errorMessage,
  onCancel,
  onConfirm
}: ActionDialogFooterProps) {
  return (
    <div className="flex flex-col gap-3">
      {errorMessage ? <p className="text-destructive text-sm" role="alert">{errorMessage}</p> : null}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Voltar</Button>
        <Button type="button" onClick={onConfirm} disabled={isPending || isConfirmDisabled} aria-busy={isPending}>
          {isPending ? <Spinner className="size-4" /> : null}
          {confirmLabel}
        </Button>
      </DialogFooter>
    </div>
  )
}
