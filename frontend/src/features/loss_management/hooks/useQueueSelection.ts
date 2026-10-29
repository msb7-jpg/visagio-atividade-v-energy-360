import { useCallback, useMemo, useState } from 'react'
import type { SuspiciousUnit } from '@/features/loss_management/types/lossTypes'

const isSelectable = (unit: SuspiciousUnit) => unit.situacao === 'na_fila'

/**
 * Seleção em massa da fila: só UCs livres (sem ordem gerada nem em campo) podem ser marcadas.
 *
 * A seleção acompanha a lista: UCs que saem dela (filtro, nova ordem) deixam de contar enquanto estão fora.
 * Se voltarem à lista ao remover o filtro, voltam marcadas: a escolha do gerente não se perde por filtrar.
 *
 * @param units - UCs visíveis na fila, já priorizadas.
 * @returns Seleção atual (na ordem da fila) e ações de marcar, desmarcar, topo e grupo.
 */
export function useQueueSelection(units: SuspiciousUnit[]) {
  const [pickedIds, setPickedIds] = useState<ReadonlySet<string>>(() => new Set())
  const selectableIds = useMemo(() => units.filter(isSelectable).map((unit) => unit.id_uc), [units])
  const selectedIds = useMemo(() => selectableIds.filter((idUc) => pickedIds.has(idUc)), [selectableIds, pickedIds])

  const toggle = useCallback(
    (idUc: string) => {
      if (!selectableIds.includes(idUc)) return
      setPickedIds((currentIds) => {
        const nextIds = new Set(currentIds)
        if (nextIds.has(idUc)) nextIds.delete(idUc)
        else nextIds.add(idUc)
        return nextIds
      })
    },
    [selectableIds]
  )

  const selectTop = useCallback(
    (count: number, include: (unit: SuspiciousUnit) => boolean = () => true) => {
      const eligibleIds = units.filter((unit) => isSelectable(unit) && include(unit)).map((unit) => unit.id_uc)
      setPickedIds(new Set(eligibleIds.slice(0, count)))
    },
    [units]
  )
  const clear = useCallback(() => setPickedIds(new Set()), [])
  const selectOnly = useCallback(
    (idUc: string) => setPickedIds(new Set(selectableIds.includes(idUc) ? [idUc] : [])),
    [selectableIds]
  )
  const toggleMany = useCallback(
    (idUcs: readonly string[]) => {
      const groupIds = idUcs.filter((idUc) => selectableIds.includes(idUc))
      setPickedIds((currentIds) => {
        const isGroupPicked = groupIds.length > 0 && groupIds.every((idUc) => currentIds.has(idUc))
        const nextIds = new Set(currentIds)
        for (const idUc of groupIds) {
          if (isGroupPicked) nextIds.delete(idUc)
          else nextIds.add(idUc)
        }
        return nextIds
      })
    },
    [selectableIds]
  )
  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds])
  const isSelected = useCallback((idUc: string) => selectedIdSet.has(idUc), [selectedIdSet])

  return { selectedIds, isSelected, isSelectable, toggle, selectTop, selectOnly, toggleMany, clear }
}
