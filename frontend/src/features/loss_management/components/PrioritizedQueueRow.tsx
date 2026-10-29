import type { KeyboardEvent, MouseEvent } from 'react'
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
import { describeShortHistory } from '@/features/loss_management/utils/baseHistory'
import { formatPlaceName } from '@/features/loss_management/utils/textFormat'

/** Controles dentro da linha que têm ação própria e não devem abrir o painel de detalhe. */
const INTERACTIVE_SELECTOR = 'a, button, input, [role="checkbox"]'

interface PrioritizedQueueRowProps {
  unit: SuspiciousUnit
  rank: number
  isSelected: boolean
  isSelectable: boolean
  onToggle: (idUc: string) => void
  onOpen: (idUc: string) => void
}

/**
 * Linha da fila priorizada: marcação, posição, UC (link para a Visão 360), território, score, queda de consumo,
 * chance de acerto e situação. Clicar na linha, ou Enter com ela focada, abre o painel de detalhe da UC.
 *
 * @param props - UC, posição, estado de seleção e callbacks de marcação e de abertura do detalhe.
 * @returns Linha da tabela; UCs com ordem gerada ou em campo não podem ser marcadas.
 */
export function PrioritizedQueueRow({ unit, rank, isSelected, isSelectable, onToggle, onOpen }: PrioritizedQueueRowProps) {
  const handleClick = (event: MouseEvent<HTMLTableRowElement>) => {
    if (event.target instanceof Element && event.target.closest(INTERACTIVE_SELECTOR)) return
    onOpen(unit.id_uc)
  }
  const handleKeyDown = (event: KeyboardEvent<HTMLTableRowElement>) => {
    if (event.key === 'Enter' && event.target === event.currentTarget) onOpen(unit.id_uc)
  }

  const shortHistory = describeShortHistory(unit)

  return (
    <TableRow
      className="cursor-pointer"
      data-state={isSelected ? 'selected' : undefined}
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
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
          <span className="text-muted-foreground text-xs">{unit.municipio ? formatPlaceName(unit.municipio) : '—'}</span>
        </div>
      </TableCell>
      <TableCell>{unit.classe_consumo ? formatPlaceName(unit.classe_consumo) : '—'}</TableCell>
      <TableCell><ScoreBar score={unit.score} /></TableCell>
      <TableCell>
        <div className="flex flex-col">
          <span className="font-mono">{formatConsumptionDrop(unit.consumo_base_kwh, unit.consumo_recente_kwh)}</span>
          <span className="text-muted-foreground text-xs">
            {formatInteger(unit.consumo_base_kwh)} → {formatInteger(unit.consumo_recente_kwh)} kWh/mês
          </span>
          {shortHistory ? <span className="text-warning text-xs">{shortHistory}</span> : null}
        </div>
      </TableCell>
      <TableCell><span className="font-mono">{formatPercent(unit.probabilidade_acerto)}</span></TableCell>
      <TableCell><span className="font-mono">{formatInteger(unit.kwh_mes_recuperavel)}</span></TableCell>
      <TableCell><span className="font-mono">{formatCompactCurrency(unit.valor_ano_rs)}</span></TableCell>
      <TableCell><QueueSituationBadge situation={unit.situacao} /></TableCell>
    </TableRow>
  )
}
