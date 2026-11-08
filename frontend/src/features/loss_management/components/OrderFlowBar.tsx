import { ArrowRight, ClipboardCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { useCanWriteLosses } from '@/features/loss_management/hooks/useCanWriteLosses'

interface OrderFlowBarProps {
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
 * Faixa acima do quadro: o ciclo da ordem à esquerda e, à direita, o único botão azul da aba, "Registrar achado".
 * Exportar e importar ficam em `OrderSheetActions`, no topo.
 *
 * @param props - `onRegister` abre o registro manual de um achado.
 * @returns Faixa com a legenda; o botão só aparece para quem pode editar perdas.
 */
export function OrderFlowBar({ onRegister }: OrderFlowBarProps) {
  const canWrite = useCanWriteLosses()
  return (
    <div className="bg-muted/40 border-border flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
      <OrderFlowLegend />
      {canWrite ? (
        <Button type="button" onClick={onRegister}>
          <ClipboardCheck aria-hidden="true" />
          Registrar achado
        </Button>
      ) : null}
    </div>
  )
}
