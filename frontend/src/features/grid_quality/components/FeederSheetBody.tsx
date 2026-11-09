import { FeederSheetSection as Section } from '@/features/grid_quality/components/FeederSheetSection'
import { FeederLimitMeters } from '@/features/grid_quality/components/FeederLimitMeters'
import { FeederMonthlyBars } from '@/features/grid_quality/components/FeederMonthlyBars'
import { FeederYearlyBars } from '@/features/grid_quality/components/FeederYearlyBars'
import type { FeederHistoryPoint, FeederRanking } from '@/features/grid_quality/types/qualityTypes'
import { formatMonth } from '@/lib/periods/periodPresets'

interface FeederSheetBodyProps {
  points: FeederHistoryPoint[]
  /** Linha do ranking do alimentador, com a situação calculada pela API; ausente quando o filtro a esconde. */
  feeder: FeederRanking | undefined
}

/**
 * Corpo do painel do alimentador: situação no ano, ano a ano e horas por mês.
 *
 * @param props - Série mensal e linha do ranking.
 * @returns Seções separadas por linhas finas.
 */
export function FeederSheetBody({ points, feeder }: FeederSheetBodyProps) {
  const latest = points[points.length - 1]
  return (
    <div className="divide-border flex flex-col divide-y">
      <Section title={`No ano, até ${formatMonth(feeder?.competencia ?? latest.competencia)}`}>
        <FeederLimitMeters
          status={feeder?.status}
          decHours={feeder?.dec_acumulado_ano_horas ?? latest.dec_acumulado_ano_horas}
          decLimit={feeder?.dec_limite_horas ?? latest.dec_limite_horas}
          fecTimes={feeder?.fec_acumulado_ano_vezes ?? latest.fec_acumulado_ano_vezes}
          fecLimit={feeder?.fec_limite_vezes ?? latest.fec_limite_vezes}
        />
      </Section>
      <Section title="Horas sem energia por ano">
        <FeederYearlyBars points={points} />
      </Section>
      <Section title="Horas sem energia por mês">
        <FeederMonthlyBars points={points} />
      </Section>
    </div>
  )
}
