import { ShieldCheck } from 'lucide-react'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableColumns, TableRow } from '@/components/ui/table'
import type { LossInspection } from '@/features/customer360/types/customer360Types'
import { formatCount, formatDate, formatKwh, type BadgeVariant } from '@/features/customer360/utils/customer360Formatters'
import { formatGoldCode } from '@/features/customer360/utils/gridEventLabels'

const COLUMNS = ['Data', 'Inspetor', 'Resultado', 'Irregularidade', 'Energia recuperada'] as const

function inspectionResult(inspection: LossInspection): { label: string, variant: BadgeVariant } {
  if (inspection.irregularidade_constatada === null) {
    return { label: 'Sem resultado', variant: 'outline' }
  }
  return inspection.irregularidade_constatada
    ? { label: 'Irregular', variant: 'destructive' }
    : { label: 'Regular', variant: 'secondary' }
}

function describeInspections(inspections: LossInspection[]): string {
  const irregular = inspections.filter((inspection) => inspection.irregularidade_constatada === true)
  const total = `${formatCount(inspections.length, 'inspeção feita', 'inspeções feitas')} nesta unidade`
  if (irregular.length === 0) {
    return `${total}, sem irregularidade constatada.`
  }
  const recoveredKwh = irregular.reduce((accumulated, inspection) => accumulated + (inspection.kwh_recuperado ?? 0), 0)
  return `${total}: irregularidade constatada em ${irregular.length}, com ${formatKwh(recoveredKwh)} recuperados.`
}

interface LossInspectionsListProps {
  inspections: LossInspection[]
}

/**
 * Histórico de inspeções de perdas da UC: quando a equipe de campo esteve lá, o que encontrou e quanto recuperou.
 *
 * @param props - Inspeções retornadas por `/events`, da mais recente para a mais antiga.
 * @returns Resumo das irregularidades e a tabela de inspeções.
 */
export function LossInspectionsList({ inspections }: LossInspectionsListProps) {
  if (inspections.length === 0) {
    return (
      <EmptyState
        title="Nenhuma inspeção registrada"
        description="A equipe de perdas ainda não inspecionou esta unidade consumidora."
        icon={<ShieldCheck className="size-10" />}
      />
    )
  }
  return (
    <div className="flex flex-col gap-3">
      <p className="text-muted-foreground text-sm">{describeInspections(inspections)}</p>
      <Table aria-label="Inspeções de perdas da unidade consumidora">
        <TableColumns columns={COLUMNS} />
        <TableBody>
          {inspections.map((inspection) => {
            const result = inspectionResult(inspection)
            return (
              <TableRow key={inspection.id_inspecao}>
                <TableCell>{formatDate(inspection.data_inspecao)}</TableCell>
                <TableCell><span className="font-mono">{inspection.id_inspetor ?? '—'}</span></TableCell>
                <TableCell><Badge variant={result.variant}>{result.label}</Badge></TableCell>
                <TableCell>{inspection.tipo_irregularidade ? formatGoldCode(inspection.tipo_irregularidade) : '—'}</TableCell>
                <TableCell>{formatKwh(inspection.kwh_recuperado)}</TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
