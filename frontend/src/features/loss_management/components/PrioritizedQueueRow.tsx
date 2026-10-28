import { Link } from 'react-router-dom'
import { Checkbox } from '@/components/ui/checkbox'
import { TableCell, TableRow } from '@/components/ui/table'
import { QueueSituationBadge } from '@/features/loss_management/components/QueueSituationBadge'
import { ScoreBar } from '@/features/loss_management/components/ScoreBar'
import type { SuspiciousUnit } from '@/features/loss_management/types/lossTypes'
import {
  formatCompactCurrency,
  formatConsumptionDrop,
  formatInteger,
  formatPercent
} from '@/features/loss_management/utils/lossFormatters'

interface PrioritizedQueueRowProps {
  unit: SuspiciousUnit
  rank: number
  isSelected: boolean
  isSelectable: boolean
  onToggle: (idUc: string) => void
}

/**
 * Linha da fila priorizada: marcação, posição, UC (link para a Visão 360), território, score, queda de consumo,
 * chance de acerto e situação.
 *
 * @param props - UC, posição, estado de seleção e callback de marcação.
 * @returns Linha da tabela; UCs com ordem gerada ou em campo não podem ser marcadas.
 */
export function PrioritizedQueueRow({ unit, rank, isSelected, isSelectable, onToggle }: PrioritizedQueueRowProps) {
  return (
    <TableRow data-state={isSelected ? 'selected' : undefined}>
      <TableCell>
        <Checkbox
          aria-label={`Selecionar ${unit.id_uc}`}
          checked={isSelected}
          disabled={!isSelectable}
          onCheckedChange={() => onToggle(unit.id_uc)}
        />
      </TableCell>
      <TableCell><span className="text-muted-foreground">{rank}</span></TableCell>
      <TableCell>
        <Link className="text-primary font-mono underline" to={`/customers?uc=${encodeURIComponent(unit.id_uc)}`}>
          {unit.id_uc}
        </Link>
      </TableCell>
      <TableCell>
        <div className="flex flex-col">
          <span>{unit.bairro ?? '—'}</span>
          <span className="text-muted-foreground text-xs">{unit.municipio ?? '—'}</span>
        </div>
      </TableCell>
      <TableCell>{unit.classe_consumo ?? '—'}</TableCell>
      <TableCell><ScoreBar score={unit.score} /></TableCell>
      <TableCell>
        <div className="flex flex-col">
          <span className="font-mono">{formatConsumptionDrop(unit.consumo_base_kwh, unit.consumo_recente_kwh)}</span>
          <span className="text-muted-foreground text-xs">
            {formatInteger(unit.consumo_base_kwh)} → {formatInteger(unit.consumo_recente_kwh)} kWh/mês
          </span>
        </div>
      </TableCell>
      <TableCell><span className="font-mono">{formatPercent(unit.probabilidade_acerto)}</span></TableCell>
      <TableCell><span className="font-mono">{formatInteger(unit.kwh_mes_recuperavel)}</span></TableCell>
      <TableCell><span className="font-mono">{formatCompactCurrency(unit.valor_ano_rs)}</span></TableCell>
      <TableCell><QueueSituationBadge situation={unit.situacao} /></TableCell>
    </TableRow>
  )
}
