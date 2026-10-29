import type { PriorInspection } from '@/features/loss_management/types/unitDetailTypes'
import { formatIsoDate } from '@/features/loss_management/utils/unitDetailFormat'

const EMPTY_VALUE = '—'

function resultLabel(inspection: PriorInspection): string {
  if (inspection.irregularidade_constatada === null) return 'Resultado não registrado'
  return inspection.irregularidade_constatada ? 'Irregularidade confirmada' : 'Sem irregularidade'
}

/** A API não manda id da inspeção: a chave vem do conteúdo, com contador para duas inspeções idênticas. */
function withStableKeys(inspections: PriorInspection[]) {
  const occurrences = new Map<string, number>()
  return inspections.map((inspection) => {
    const baseKey = `${inspection.origem}-${inspection.data_inspecao ?? 'sem-data'}-${inspection.inspetor ?? 'sem-inspetor'}`
    const occurrence = occurrences.get(baseKey) ?? 0
    occurrences.set(baseKey, occurrence + 1)
    return { key: `${baseKey}-${occurrence}`, inspection }
  })
}

interface PriorInspectionsListProps {
  inspections: PriorInspection[]
}

/**
 * Inspeções anteriores da UC, da mais recente para a mais antiga: data, resultado e inspetor.
 *
 * @param props - Inspeções do histórico de campo e das ordens concluídas no portal.
 * @returns Lista, ou a mensagem de vazio quando a UC nunca foi inspecionada.
 */
export function PriorInspectionsList({ inspections }: PriorInspectionsListProps) {
  if (inspections.length === 0) {
    return <p className="text-muted-foreground text-sm">Nenhuma inspeção anterior para esta UC.</p>
  }
  return (
    <ul className="divide-border flex flex-col divide-y">
      {withStableKeys(inspections).map(({ key, inspection }) => (
        <li key={key} className="flex flex-col gap-1 py-2 text-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono">
              {inspection.data_inspecao ? formatIsoDate(inspection.data_inspecao) : 'Data não registrada'}
            </span>
            <span className="text-muted-foreground text-xs">{inspection.inspetor ?? EMPTY_VALUE}</span>
          </div>
          <span>{resultLabel(inspection)}</span>
        </li>
      ))}
    </ul>
  )
}
