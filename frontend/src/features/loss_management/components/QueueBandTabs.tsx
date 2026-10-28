import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PrioritizedQueueTable } from '@/features/loss_management/components/PrioritizedQueueTable'
import type { useQueueSelection } from '@/features/loss_management/hooks/useQueueSelection'
import type { SuspiciousUnit } from '@/features/loss_management/types/lossTypes'
import { formatInteger, formatPercent } from '@/features/loss_management/utils/lossFormatters'
import { PRIORITY_MIN_HIT_PROBABILITY, splitQueueBands } from '@/features/loss_management/utils/queueBands'

type BandKey = 'priority' | 'lowChance' | 'all'

interface QueueBandTabsProps {
  units: SuspiciousUnit[]
  /** UCs que passam nos filtros, antes do corte da fila. */
  total: number
  selection: ReturnType<typeof useQueueSelection>
  onOpenDetail: (idUc: string) => void
}

function firstBandWithUnits(priorityCount: number, lowChanceCount: number): BandKey {
  if (priorityCount > 0) return 'priority'
  return lowChanceCount > 0 ? 'lowChance' : 'all'
}

/**
 * Fila dividida em abas pela chance de acerto: prioritárias, baixa chance e todas, cada uma com sua contagem.
 *
 * A ordem dentro de cada aba é a do backend (kWh esperado), então a posição (#) vale dentro da aba.
 *
 * @param props - UCs carregadas, total da fila e controle de seleção.
 * @returns Abas acima da tabela; abre nas prioritárias, ou na primeira aba com UCs quando elas não existem.
 */
export function QueueBandTabs({ units, total, selection, onOpenDetail }: QueueBandTabsProps) {
  const { priority, lowChance } = splitQueueBands(units)
  const [band, setBand] = useState<BandKey>(() => firstBandWithUnits(priority.length, lowChance.length))
  const minHitLabel = formatPercent(PRIORITY_MIN_HIT_PROBABILITY)
  const bands = [
    { key: 'priority', label: 'Prioritárias', units: priority, hint: `Chance de acerto de ${minHitLabel} ou mais` },
    { key: 'lowChance', label: 'Baixa chance', units: lowChance, hint: `Chance de acerto abaixo de ${minHitLabel}` },
    { key: 'all', label: 'Todas', units, hint: 'Todas as UCs, na ordem do kWh esperado' }
  ] as const

  return (
    <div className="flex flex-col gap-2">
      {total > units.length ? (
        <p className="text-muted-foreground text-xs">
          Carregadas as {formatInteger(units.length)} primeiras UCs de {formatInteger(total)} na fila.
        </p>
      ) : null}
      <Tabs variant="line" value={band} onValueChange={(nextBand) => setBand(nextBand as BandKey)}>
        <TabsList aria-label="Faixa da fila por chance de acerto">
          {bands.map((item) => (
            <TabsTrigger key={item.key} value={item.key} disabled={item.units.length === 0}>
              {item.label} · {formatInteger(item.units.length)}
            </TabsTrigger>
          ))}
        </TabsList>
        {bands.map((item) => (
          <TabsContent key={item.key} value={item.key}>
            <div className="flex flex-col gap-2">
              <p className="text-muted-foreground text-xs">{item.hint}</p>
              <PrioritizedQueueTable
                units={item.units}
                label={`Fila: ${item.label.toLowerCase()}`}
                selection={selection}
                onOpenDetail={onOpenDetail}
              />
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
