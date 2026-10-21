import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { SuspicionReason, SuspiciousUnit } from '@/features/loss_management/types/lossTypes'
import { formatCurrency, formatKwh, REASON_LABELS } from '@/features/loss_management/utils/lossFormatters'

const REASON_BADGE_VARIANT: Record<SuspicionReason, 'destructive' | 'outline'> = {
  queda_subita: 'destructive',
  leitura_zerada: 'outline'
}

interface SuspiciousUnitsTableProps {
  units: SuspiciousUnit[]
  onGenerateOrder: (unit: SuspiciousUnit) => void
}

/**
 * Ranking da fila de suspeitas (ordem já priorizada pelo backend).
 *
 * @param props - UCs da fila e callback para gerar ordem.
 * @returns Tabela com motivo, score e energia a recuperar.
 */
export function SuspiciousUnitsTable({ units, onGenerateOrder }: SuspiciousUnitsTableProps) {
  return (
    <Table aria-label="Fila de UCs suspeitas">
      <TableHeader>
        <TableRow>
          <TableHead>#</TableHead>
          <TableHead>UC</TableHead>
          <TableHead>Município / Bairro</TableHead>
          <TableHead>Classe</TableHead>
          <TableHead>Motivo</TableHead>
          <TableHead>Score</TableHead>
          <TableHead>Energia a recuperar</TableHead>
          <TableHead>Ação</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {units.map((unit, rankIndex) => (
          <TableRow key={unit.id_uc}>
            <TableCell><span className="text-muted-foreground">{rankIndex + 1}</span></TableCell>
            <TableCell><span className="font-mono">{unit.id_uc}</span></TableCell>
            <TableCell>
              <div className="flex flex-col">
                <span>{unit.municipio ?? '—'}</span>
                <span className="text-muted-foreground text-xs">{unit.bairro ?? '—'}</span>
              </div>
            </TableCell>
            <TableCell>{unit.classe_consumo ?? '—'}</TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1">
                {unit.motivos.map((reason) => (
                  <Badge key={reason} variant={REASON_BADGE_VARIANT[reason]}>{REASON_LABELS[reason]}</Badge>
                ))}
              </div>
            </TableCell>
            <TableCell><span className="font-mono">{unit.score_risco.toFixed(1)}</span></TableCell>
            <TableCell>
              <div className="flex flex-col">
                <span className="text-foreground font-semibold">{formatKwh(unit.kwh_estimado_recuperar)}</span>
                <span className="text-muted-foreground text-xs">{formatCurrency(unit.valor_estimado_recuperar_rs)}</span>
              </div>
            </TableCell>
            <TableCell>
              <Button size="sm" aria-label={`Gerar ordem para ${unit.id_uc}`} onClick={() => onGenerateOrder(unit)}>
                Gerar ordem
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
