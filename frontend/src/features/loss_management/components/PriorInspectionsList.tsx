import type { LucideIcon } from 'lucide-react'
import { ShieldAlert, ShieldCheck, ShieldQuestion } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { PriorInspection } from '@/features/loss_management/types/unitDetailTypes'
import { formatIsoDate } from '@/features/loss_management/utils/unitDetailFormat'

interface ResultLook {
  label: string
  icon: LucideIcon
  tone: string
}

function resultLook(inspection: PriorInspection): ResultLook {
  if (inspection.irregularidade_constatada === null) {
    return { label: 'Resultado não registrado', icon: ShieldQuestion, tone: 'text-muted-foreground bg-muted' }
  }
  return inspection.irregularidade_constatada
    ? { label: 'Irregularidade confirmada', icon: ShieldAlert, tone: 'text-destructive bg-destructive/10' }
    : { label: 'Sem irregularidade', icon: ShieldCheck, tone: 'text-success bg-success/15' }
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
 * Inspeções anteriores da UC, da mais recente para a mais antiga: ícone do resultado, data e inspetor.
 *
 * @param props - Inspeções do histórico de campo e das ordens concluídas no portal.
 * @returns Lista, ou a mensagem de vazio quando a UC nunca foi inspecionada.
 */
export function PriorInspectionsList({ inspections }: PriorInspectionsListProps) {
  if (inspections.length === 0) {
    return (
      <p className="text-muted-foreground flex items-center gap-2 text-sm">
        <ShieldQuestion className="size-4 shrink-0" aria-hidden="true" />
        Nenhuma inspeção anterior.
      </p>
    )
  }
  return (
    <ul className="divide-border flex flex-col divide-y">
      {withStableKeys(inspections).map(({ key, inspection }) => {
        const look = resultLook(inspection)
        const Icon = look.icon
        return (
          <li key={key} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
            <span className={`flex size-8 shrink-0 items-center justify-center rounded-md ${look.tone}`}>
              <Icon className="size-4" aria-hidden="true" />
            </span>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="text-foreground text-sm font-medium">{look.label}</span>
              <span className="text-muted-foreground text-xs tabular-nums">
                {inspection.data_inspecao ? formatIsoDate(inspection.data_inspecao) : 'Data não registrada'}
              </span>
            </div>
            {inspection.inspetor ? <Badge variant="outline">{inspection.inspetor}</Badge> : null}
          </li>
        )
      })}
    </ul>
  )
}
