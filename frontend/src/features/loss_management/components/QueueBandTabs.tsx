import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PrioritizedQueueTable } from '@/features/loss_management/components/PrioritizedQueueTable'
import type { useQueueSelection } from '@/features/loss_management/hooks/useQueueSelection'
import type { SuspiciousUnit } from '@/features/loss_management/types/lossTypes'
import { formatInteger } from '@/features/loss_management/utils/lossFormatters'
import { splitQueueBands } from '@/features/loss_management/utils/queueBands'

type BandKey = 'priority' | 'lowChance' | 'all'

interface QueueBandTabsProps {
  units: SuspiciousUnit[]
  /** UCs que passam nos filtros, antes do corte da fila. */
  total: number
  selection: ReturnType<typeof useQueueSelection>
  onOpenDetail: (idUc: string) => void
  /** Busca a próxima página da fila no servidor; sem ele, o botão de carregar mais não aparece. */
  onLoadMore?: () => void
  isLoadingMore?: boolean
}

function firstBandWithUnits(priorityCount: number, lowChanceCount: number): BandKey {
  if (priorityCount > 0) return 'priority'
  return lowChanceCount > 0 ? 'lowChance' : 'all'
}

/**
 * Fila dividida em abas por prioridade: prioritárias, demais e todas, cada uma com sua contagem.
 *
 * A ordem dentro de cada aba é a do backend (maior prioridade primeiro), então a posição (#) vale dentro da aba.
 *
 * @param props - UCs carregadas, total da fila e controle de seleção.
 * @returns Abas acima da tabela; abre nas prioritárias, ou na primeira aba com UCs quando elas não existem, e
 * volta para elas quando a fila passa a ter prioritárias.
 */
export function QueueBandTabs({ units, total, selection, onOpenDetail, onLoadMore, isLoadingMore = false }: QueueBandTabsProps) {
  const { priority, lowChance } = splitQueueBands(units)
  const [band, setBand] = useState<BandKey>(() => firstBandWithUnits(priority.length, lowChance.length))
  const [hadPriority, setHadPriority] = useState(priority.length > 0)
  const hasPriority = priority.length > 0
  const isBandEmpty = (band === 'priority' && !hasPriority) || (band === 'lowChance' && lowChance.length === 0)
  // A fila muda com os filtros: se as prioritárias aparecem ou somem, ou a faixa aberta esvazia, a aba é refeita
  // (ajuste no render, sem efeito). Enquanto a faixa escolhida tem UCs, a escolha do usuário é mantida.
  if (hadPriority !== hasPriority || isBandEmpty) {
    setHadPriority(hasPriority)
    setBand(firstBandWithUnits(priority.length, lowChance.length))
  }
  const bands = [
    { key: 'priority', label: 'Prioritárias', units: priority, hint: 'Queda abrupta, leitura zerada ou queda além da variação da carteira' },
    { key: 'lowChance', label: 'Demais', units: lowChance, hint: 'UCs fora da faixa prioritária' },
    { key: 'all', label: 'Todas', units, hint: 'Todas as UCs, na ordem de prioridade' }
  ] as const

  return (
    <Tabs variant="line" value={band} onValueChange={(nextBand) => setBand(nextBand as BandKey)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TabsList aria-label="Faixa da fila por prioridade">
          {bands.map((item) => (
            <TabsTrigger key={item.key} value={item.key} disabled={item.units.length === 0}>
              {item.label} · {formatInteger(item.units.length)}
            </TabsTrigger>
          ))}
        </TabsList>
        {total > units.length ? (
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-muted-foreground text-xs">
              Carregadas as {formatInteger(units.length)} primeiras UCs de {formatInteger(total)} na fila.
            </p>
            {onLoadMore ? (
              <Button type="button" variant="outline" size="sm" onClick={onLoadMore} disabled={isLoadingMore}>
                Carregar mais UCs
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
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
  )
}
