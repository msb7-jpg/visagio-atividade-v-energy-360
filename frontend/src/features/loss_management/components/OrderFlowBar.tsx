import { ArrowRight, ClipboardCheck, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { ExportOrdersButton } from '@/features/loss_management/components/ExportOrdersButton'
import { useCanWriteLosses } from '@/features/loss_management/hooks/useCanWriteLosses'

interface OrderFlowBarProps {
  canExport: boolean
  onImport: () => void
  onRegister: () => void
}

/**
 * Legenda do ciclo da ordem: Gerada → Pendente (em campo) → Concluída, ou Cancelada (com motivo).
 *
 * @returns Selos das etapas ligados por setas.
 */
function OrderFlowLegend() {
  return (
    <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm" aria-label="Ciclo da ordem de inspeção">
      <StatusBadge kind="ordem" status="gerada" />
      <ArrowRight aria-hidden="true" className="size-3.5" />
      <StatusBadge kind="ordem" status="pendente_em_campo" />
      <ArrowRight aria-hidden="true" className="size-3.5" />
      <StatusBadge kind="ordem" status="concluida" />
      <span>· ou</span>
      <StatusBadge kind="ordem" status="cancelada" />
      <span>(com motivo)</span>
    </div>
  )
}

/**
 * Barra acima do quadro: o ciclo da ordem à esquerda e as ações da planilha de campo à direita.
 *
 * @param props - `canExport` liga o botão de exportar; `onImport` abre o envio da planilha preenchida;
 * `onRegister` abre o registro manual de um achado.
 * @returns Faixa com a legenda e os botões; registrar e importar só aparecem para quem pode editar perdas.
 */
export function OrderFlowBar({ canExport, onImport, onRegister }: OrderFlowBarProps) {
  const canWrite = useCanWriteLosses()
  return (
    <div className="bg-muted/40 border-border flex flex-wrap items-start justify-between gap-3 rounded-lg border p-3">
      <OrderFlowLegend />
      <div className="flex flex-wrap items-start justify-end gap-3">
        <ExportOrdersButton disabled={!canExport} label="Exportar para o campo (CSV)" />
        {canWrite ? (
          <>
            <Button type="button" variant="outline" onClick={onRegister}>
              <ClipboardCheck aria-hidden="true" />
              Registrar achado
            </Button>
            <Button type="button" onClick={onImport}>
              <Upload aria-hidden="true" />
              Importar resultados de campo
            </Button>
          </>
        ) : null}
      </div>
    </div>
  )
}
