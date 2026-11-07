import { useState } from 'react'
import { AsyncState } from '@/components/feedback/AsyncState'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useExcludedUnitsQuery } from '@/features/loss_management/hooks/useLossQueries'
import type { ExclusionReason } from '@/features/loss_management/types/excludedTypes'
import {
  describeExclusion,
  EXCLUSION_HINTS,
  EXCLUSION_LABELS,
  formatReturnDate
} from '@/features/loss_management/utils/exclusionLabels'
import { formatInteger } from '@/features/loss_management/utils/lossFormatters'

const EMPTY_VALUE = '—'

/**
 * Aba "Fora da fila": UCs com queda de consumo que a fila deixou de fora, com o motivo e quando voltam a ser avaliadas.
 *
 * @returns Resumo por motivo (filtra a tabela) e a tabela paginada pelo servidor.
 */
export function ExcludedQueueTab() {
  const [reason, setReason] = useState<ExclusionReason | undefined>(undefined)
  const query = useExcludedUnitsQuery(reason ? { motivo: reason } : {})
  const units = query.data?.pages.flatMap((page) => page.itens) ?? []
  const total = query.data?.pages[0]?.total ?? 0
  const summary = query.data?.pages[0]?.resumo ?? []

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtrar por motivo da exclusão">
        {summary.map((entry) => (
          <Button
            key={entry.motivo}
            type="button"
            size="sm"
            variant={reason === entry.motivo ? 'default' : 'outline'}
            aria-pressed={reason === entry.motivo}
            title={EXCLUSION_HINTS[entry.motivo]}
            onClick={() => setReason(reason === entry.motivo ? undefined : entry.motivo)}
          >
            {EXCLUSION_LABELS[entry.motivo]} ({formatInteger(entry.total)})
          </Button>
        ))}
      </div>
      <AsyncState
        isLoading={query.isLoading}
        isError={query.isError}
        isEmpty={units.length === 0}
        errorTitle="Não foi possível carregar as UCs fora da fila"
        errorDescription="Verifique a conexão com a API e se as tabelas Gold de cadastro e medição estão disponíveis."
        onRetry={() => void query.refetch()}
        emptyTitle="Nenhuma UC fora da fila"
        emptyDescription="Toda UC com queda de consumo está na fila."
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>UC</TableHead>
              <TableHead>Bairro / Município</TableHead>
              <TableHead>Classe</TableHead>
              <TableHead>Motivo da exclusão</TableHead>
              <TableHead>Detalhe</TableHead>
              <TableHead>Volta a ser avaliada</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {units.map((unit) => (
              <TableRow key={unit.id_uc}>
                <TableCell>
                  <span className="font-mono">{unit.id_uc}</span>
                </TableCell>
                <TableCell>
                  {unit.bairro ?? EMPTY_VALUE}
                  <span className="text-muted-foreground block text-xs">{unit.municipio ?? EMPTY_VALUE}</span>
                </TableCell>
                <TableCell>{unit.classe_consumo ?? EMPTY_VALUE}</TableCell>
                <TableCell>{EXCLUSION_LABELS[unit.motivo_exclusao]}</TableCell>
                <TableCell>
                  <span className="text-muted-foreground">{describeExclusion(unit)}</span>
                </TableCell>
                <TableCell>{formatReturnDate(unit)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="mt-3 flex items-center justify-between gap-3 text-sm">
          <span className="text-muted-foreground">
            Mostrando {formatInteger(units.length)} de {formatInteger(total)} UCs
          </span>
          {query.hasNextPage ? (
            <Button
              type="button"
              variant="outline"
              disabled={query.isFetchingNextPage}
              onClick={() => void query.fetchNextPage()}
            >
              Carregar mais
            </Button>
          ) : null}
        </div>
      </AsyncState>
    </div>
  )
}
