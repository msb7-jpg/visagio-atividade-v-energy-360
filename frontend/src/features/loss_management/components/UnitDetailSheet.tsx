import { isAxiosError } from 'axios'
import { useState } from 'react'
import { MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AsyncState } from '@/components/feedback/AsyncState'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { QueueSituationBadge } from '@/features/loss_management/components/QueueSituationBadge'
import { UnitDetailBody } from '@/features/loss_management/components/UnitDetailBody'
import { useCanWriteLosses } from '@/features/loss_management/hooks/useCanWriteLosses'
import { useUnitDetailQuery } from '@/features/loss_management/hooks/useLossQueries'
import type { UnitDetail } from '@/features/loss_management/types/unitDetailTypes'
import { formatPlaceName } from '@/features/loss_management/utils/textFormat'

const NOT_FOUND_STATUS = 404

const readable = (rawName: string | null) => (rawName ? formatPlaceName(rawName) : null)

function describeLocation(detail: UnitDetail | undefined): string {
  if (!detail) return 'Carregando os dados da UC'
  const place = [readable(detail.bairro), readable(detail.municipio)].filter(Boolean).join(', ')
  const parts = [place, readable(detail.classe_consumo)].filter(Boolean)
  return parts.length > 0 ? parts.join(' · ') : 'Sem cadastro de território'
}

interface UnitDetailSheetProps {
  /** UC aberta no painel; nulo mantém o painel fechado. */
  idUc: string | null
  onClose: () => void
  /** Segue o fluxo atual de geração: marca só esta UC e abre a confirmação de ordem. */
  onGenerateOrder: (idUc: string) => void
}

/**
 * Painel lateral com o detalhe de uma UC da fila: por que entrou, conta do score, consumo e inspeções anteriores.
 *
 * @param props - UC aberta, fechamento e geração de ordem para esta UC.
 * @returns Sheet com skeleton, erro com nova tentativa, vazio ou o detalhe; quem só consulta não vê o botão de gerar.
 */
export function UnitDetailSheet({ idUc, onClose, onGenerateOrder }: UnitDetailSheetProps) {
  const canWrite = useCanWriteLosses()
  const [fullHistory, setFullHistory] = useState(false)
  const [historyIdUc, setHistoryIdUc] = useState(idUc)
  // Trocar de UC com o painel aberto volta para os 12 meses; ajusta o estado no render, sem efeito.
  if (historyIdUc !== idUc) {
    setHistoryIdUc(idUc)
    setFullHistory(false)
  }
  const query = useUnitDetailQuery(idUc, fullHistory)
  const isNotFound = isAxiosError(query.error) && query.error.response?.status === NOT_FOUND_STATUS
  const hasLoadError = query.isError && !isNotFound
  const detail = query.data

  function handleClose() {
    setFullHistory(false)
    onClose()
  }

  return (
    <Sheet open={idUc !== null} onOpenChange={(isOpen) => (isOpen ? undefined : handleClose())}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-xl">
        <div className="border-border -mx-6 border-b px-6 pb-5">
          <SheetHeader>
            <div className="flex items-center gap-2.5 pr-8">
              <SheetTitle>{idUc}</SheetTitle>
              {detail ? <QueueSituationBadge situation={detail.situacao} /> : null}
            </div>
            <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
              <MapPin className="size-4 shrink-0" aria-hidden="true" />
              <SheetDescription>{describeLocation(detail)}</SheetDescription>
            </div>
          </SheetHeader>
        </div>
        <div className="-mx-6 min-h-0 flex-1 overflow-y-auto px-6 py-2">
          <AsyncState
            isLoading={query.isLoading}
            isError={hasLoadError}
            isEmpty={isNotFound}
            errorTitle="Não foi possível carregar o detalhe da UC"
            errorDescription="Verifique a conexão com a API e tente novamente."
            onRetry={() => void query.refetch()}
            emptyTitle="Sem dados para esta UC"
            emptyDescription="Esta UC não está mais na fila ou não tem medição no período."
          >
            {detail ? <UnitDetailBody detail={detail} fullHistory={fullHistory} onFullHistoryChange={setFullHistory} /> : null}
          </AsyncState>
        </div>
        {idUc ? (
          <div className="border-border -mx-6 border-t px-6">
            <SheetFooter>
              <Button asChild variant="outline">
                <Link to={`/customers?uc=${encodeURIComponent(idUc)}`}>Abrir na UC 360</Link>
              </Button>
              {canWrite ? (
                <Button type="button" disabled={detail?.situacao !== 'na_fila'} onClick={() => onGenerateOrder(idUc)}>
                  Gerar ordem desta UC
                </Button>
              ) : null}
            </SheetFooter>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
