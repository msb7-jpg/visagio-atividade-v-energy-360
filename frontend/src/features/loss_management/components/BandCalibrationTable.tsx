import { Table, TableBody, TableCaption, TableCell, TableColumns, TableRow } from '@/components/ui/table'
import type { BandBacktest, ChanceBand } from '@/features/loss_management/types/backtestTypes'
import { formatMwh } from '@/features/loss_management/utils/backtestFormat'
import { formatInteger, formatPercent } from '@/features/loss_management/utils/lossFormatters'

const EMPTY_VALUE = '—'
const COLUMNS = [
  'Faixa de chance',
  'Selecionadas',
  'Inspecionadas',
  'Acerto previsto',
  'Acerto observado',
  'Energia esperada',
  'Energia recuperada'
] as const

const BAND_LABELS: Record<ChanceBand, string> = {
  alta: 'Alta (queda de 30% ou mais além dos pares)',
  rampa: 'Rampa (queda de 20% a 30%, sem medição)',
  baixa: 'Baixa (queda até 20%)'
}

function formatRate(rate: number | null): string {
  return rate === null ? EMPTY_VALUE : formatPercent(rate)
}

interface BandRowProps {
  band: BandBacktest
}

function BandRow({ band }: BandRowProps) {
  const hasInspections = band.inspecionadas > 0
  return (
    <TableRow>
      <TableCell>{BAND_LABELS[band.faixa]}</TableCell>
      <TableCell>{formatInteger(band.selecionadas)}</TableCell>
      <TableCell>{formatInteger(band.inspecionadas)}</TableCell>
      <TableCell>{formatRate(band.chance_prevista)}</TableCell>
      <TableCell>{formatRate(band.taxa)}</TableCell>
      <TableCell>{hasInspections ? formatMwh(band.kwh_esperado) : EMPTY_VALUE}</TableCell>
      <TableCell>{hasInspections ? formatMwh(band.kwh_recuperado) : EMPTY_VALUE}</TableCell>
    </TableRow>
  )
}

interface BandCalibrationTableProps {
  bands: BandBacktest[]
}

/**
 * Previsto contra realizado por faixa de chance: o acerto e a energia que o modelo esperava, ao lado do que o campo
 * achou e recuperou. Faixa sem inspeção na janela mostra travessão, sem inventar um resultado.
 *
 * @param props - As três faixas do corte em detalhe.
 * @returns Tabela de calibração, ou aviso quando o corte não traz a decomposição por faixa.
 */
export function BandCalibrationTable({ bands }: BandCalibrationTableProps) {
  if (bands.length === 0) {
    return <p className="text-muted-foreground text-sm">Sem decomposição por faixa neste corte.</p>
  }
  return (
    <Table>
      <TableCaption className="sr-only">Previsto contra realizado por faixa de chance de acerto</TableCaption>
      <TableColumns columns={COLUMNS} />
      <TableBody>
        {bands.map((band) => (
          <BandRow key={band.faixa} band={band} />
        ))}
      </TableBody>
    </Table>
  )
}
