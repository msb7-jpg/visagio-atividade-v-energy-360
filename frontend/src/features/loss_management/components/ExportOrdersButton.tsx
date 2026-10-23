import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { useExportInspectionsMutation } from '@/features/loss_management/hooks/useLossMutations'
import { getApiErrorMessage } from '@/features/loss_management/utils/apiErrorMessage'

interface ExportOrdersButtonProps {
  disabled?: boolean
}

/**
 * Botão que baixa o CSV das ordens geradas e em campo para despacho à equipe.
 *
 * @param props - `disabled` desliga o botão quando não há ordem para despachar.
 * @returns Botão com travamento durante o download e mensagem de erro da API.
 */
export function ExportOrdersButton({ disabled = false }: ExportOrdersButtonProps) {
  const { mutate: exportOrders, isPending, isError, error } = useExportInspectionsMutation()

  return (
    <div className="flex flex-col items-end gap-2">
      <Button type="button" variant="outline" onClick={() => exportOrders()} disabled={disabled || isPending} aria-busy={isPending}>
        {isPending ? <Spinner className="size-4" /> : <Download aria-hidden="true" />}
        Exportar para campo
      </Button>
      {isError ? <p className="text-destructive text-sm" role="alert">{getApiErrorMessage(error)}</p> : null}
    </div>
  )
}
