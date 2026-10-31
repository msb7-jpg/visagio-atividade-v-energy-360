import { ClipboardCheck, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ExportOrdersButton } from '@/features/loss_management/components/ExportOrdersButton'
import { useCanWriteLosses } from '@/features/loss_management/hooks/useCanWriteLosses'

interface OrderFlowBarProps {
  canExport: boolean
  onImport: () => void
  onRegister: () => void
}

/**
 * Barra de ações acima do quadro, em uma linha: exportar a planilha de campo, registrar um achado e importar resultados.
 * As etapas do fluxo já aparecem como colunas do quadro, então não se repetem aqui.
 *
 * @param props - `canExport` liga o botão de exportar; `onImport` abre o envio da planilha preenchida;
 * `onRegister` abre o registro manual de um achado.
 * @returns Linha de botões alinhada à direita; registrar e importar só aparecem para quem pode editar perdas.
 */
export function OrderFlowBar({ canExport, onImport, onRegister }: OrderFlowBarProps) {
  const canWrite = useCanWriteLosses()
  return (
    <div className="flex flex-wrap items-start justify-end gap-3">
      <ExportOrdersButton disabled={!canExport} label="Exportar planilha de campo" />
      {canWrite ? (
        <>
          <Button type="button" onClick={onRegister}>
            <ClipboardCheck aria-hidden="true" />
            Registrar achado
          </Button>
          <Button type="button" variant="outline" onClick={onImport}>
            <Upload aria-hidden="true" />
            Importar resultados de campo
          </Button>
        </>
      ) : null}
    </div>
  )
}
