import { ArrowRight, ClipboardCheck, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { ExportOrdersButton } from '@/features/loss_management/components/ExportOrdersButton'
import { useCanWriteLosses } from '@/features/loss_management/hooks/useCanWriteLosses'
import { BOARD_COLUMNS } from '@/features/loss_management/utils/orderBoard'

interface OrderFlowBarProps {
  canExport: boolean
  onImport: () => void
  onRegister: () => void
}

/**
 * Barra acima do quadro: mostra o fluxo das etapas e oferece exportar/importar a planilha de campo.
 *
 * @param props - `canExport` liga o botão de exportar; `onImport` abre o envio da planilha preenchida;
 * `onRegister` abre o registro manual de um achado.
 * @returns Cartão com o fluxo e as ações.
 */
export function OrderFlowBar({ canExport, onImport, onRegister }: OrderFlowBarProps) {
  const [pending, inField, done, canceled] = BOARD_COLUMNS
  const canWrite = useCanWriteLosses()
  return (
    <Card className="flex flex-wrap items-center justify-between gap-3 p-3">
      <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
        <StatusBadge kind="ordem" status={pending.badge} />
        <ArrowRight aria-hidden="true" className="size-4" />
        <StatusBadge kind="ordem" status={inField.badge} />
        <ArrowRight aria-hidden="true" className="size-4" />
        <StatusBadge kind="ordem" status={done.badge} />
        <span>· ou</span>
        <StatusBadge kind="ordem" status={canceled.badge} />
        <span>(com motivo)</span>
      </div>
      <div className="flex flex-wrap items-start gap-3">
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
    </Card>
  )
}
