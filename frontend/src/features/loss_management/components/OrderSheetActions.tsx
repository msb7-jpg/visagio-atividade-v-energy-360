import { Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ExportOrdersButton } from '@/features/loss_management/components/ExportOrdersButton'
import { useCanWriteLosses } from '@/features/loss_management/hooks/useCanWriteLosses'

interface OrderSheetActionsProps {
  canExport: boolean
  onImport: () => void
}

/**
 * Ações da planilha de campo, no topo da aba à direita: exportar as ordens para despacho e importar os resultados
 * preenchidos. Os dois são neutros; o azul fica com "Registrar achado", na faixa do ciclo da ordem.
 *
 * @param props - `canExport` liga o botão de exportar; `onImport` abre o envio da planilha preenchida.
 * @returns Linha alinhada à direita; importar só aparece para quem pode editar perdas.
 */
export function OrderSheetActions({ canExport, onImport }: OrderSheetActionsProps) {
  const canWrite = useCanWriteLosses()

  return (
    <div className="flex flex-wrap items-start justify-end gap-3">
      <ExportOrdersButton disabled={!canExport} label="Exportar para o campo (CSV)" />
      {canWrite ? (
        <Button type="button" variant="outline" onClick={onImport}>
          <Upload aria-hidden="true" />
          Importar resultados de campo
        </Button>
      ) : null}
    </div>
  )
}
