import { isAxiosError } from 'axios'
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

function describeLocation(detail: UnitDetail | undefined): string {
  if (!detail) return 'Carregando os dados da UC'
  const place = [detail.bairro, detail.municipio ? formatPlaceName(detail.municipio) : null].filter(Boolean).join(', ')
  const parts = [place, detail.classe_consumo ? formatPlaceName(detail.classe_consumo) : null].filter(Boolean)
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
  const query = useUnitDetailQuery(idUc)
  const isNotFound = isAxiosError(query.error) && query.error.response?.status === NOT_FOUND_STATUS
  const hasLoadError = query.isError && !isNotFound
  const detail = query.data

  return (
    <Sheet open={idUc !== null} onOpenChange={(isOpen) => (isOpen ? undefined : onClose())}>
      <SheetContent side="right" className="flex flex-col">
        <SheetHeader>
          <SheetTitle>{idUc}</SheetTitle>
          <SheetDescription>{describeLocation(detail)}</SheetDescription>
          {detail ? <div><QueueSituationBadge situation={detail.situacao} /></div> : null}
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto">
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
            {detail ? <UnitDetailBody detail={detail} /> : null}
          </AsyncState>
        </div>
        {canWrite ? (
          <SheetFooter>
            <Button
              type="button"
              disabled={detail?.situacao !== 'na_fila'}
              onClick={() => idUc && onGenerateOrder(idUc)}
            >
              Gerar ordem desta UC
            </Button>
          </SheetFooter>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
