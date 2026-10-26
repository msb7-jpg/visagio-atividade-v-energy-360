import type { ReactNode } from 'react'
import { Headset, Wallet, Zap } from 'lucide-react'
import { LoadingSkeleton } from '@/components/feedback/LoadingSkeleton'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { CustomerEventTimeline, CustomerHistory } from '@/features/customer360/types/customer360Types'
import { formatCompetencia, formatCount, formatDate, formatMoney } from '@/features/customer360/utils/customer360Formatters'
import { analyzeOutages } from '@/features/customer360/utils/outageAnalysis'

interface FactCardProps {
  title: string
  icon: ReactNode
  value: string | undefined
  detail: string | undefined
}

function FactCard({ title, icon, value, detail }: FactCardProps) {
  return (
    <Card variant="interactive">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>{title}</CardTitle>
        <div className="bg-primary/10 text-primary rounded-lg p-1.5">{icon}</div>
      </CardHeader>
      <CardContent>
        {value === undefined
          ? <LoadingSkeleton count={2} className="h-4" />
          : (
            <>
              <div className="text-foreground text-xl font-bold tracking-tight">{value}</div>
              <CardDescription className="mt-1">{detail}</CardDescription>
            </>
          )}
      </CardContent>
    </Card>
  )
}

function invoicesFact(history: CustomerHistory | undefined) {
  if (!history) {
    return { value: undefined, detail: undefined }
  }
  const openCount = history.faturas_em_aberto.length
  return openCount === 0
    ? { value: 'Nenhuma', detail: 'Cliente sem faturas em aberto.' }
    : { value: formatMoney(history.valor_em_aberto_rs), detail: `${formatCount(openCount, 'fatura', 'faturas')} em aberto.` }
}

function outagesFact(events: CustomerEventTimeline | undefined) {
  if (!events) {
    return { value: undefined, detail: undefined }
  }
  const overview = analyzeOutages(events.qualidade_alimentador)
  if (overview.aboveNormalMonths.length === 0) {
    return { value: 'Dentro do normal', detail: `Sem meses acima da média do alimentador ${events.alimentador ?? ''}.` }
  }
  const latest = formatCompetencia(overview.aboveNormalMonths[0])
  return { value: formatCount(overview.aboveNormalMonths.length, 'mês', 'meses'), detail: `Acima do normal no último ano; o mais recente foi ${latest}.` }
}

function ticketsFact(events: CustomerEventTimeline | undefined) {
  if (!events) {
    return { value: undefined, detail: undefined }
  }
  const [latestTicket] = events.chamados
  return latestTicket
    ? { value: formatCount(events.chamados.length, 'chamado', 'chamados'), detail: `Último aberto em ${formatDate(latestTicket.data_abertura)}.` }
    : { value: 'Nenhum', detail: 'Cliente ainda não abriu chamados.' }
}

interface CustomerQuickFactsProps {
  history: CustomerHistory | undefined
  events: CustomerEventTimeline | undefined
}

/**
 * Resumo rápido da UC visível sem trocar de aba: faturas em aberto, falta de luz na região e chamados.
 *
 * @param props - Histórico e eventos da UC (undefined enquanto carregam).
 * @returns Três cards de destaque para o atendente.
 */
export function CustomerQuickFacts({ history, events }: CustomerQuickFactsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <FactCard title="Faturas em aberto" icon={<Wallet className="size-4" />} {...invoicesFact(history)} />
      <FactCard title="Falta de luz na região" icon={<Zap className="size-4" />} {...outagesFact(events)} />
      <FactCard title="Chamados" icon={<Headset className="size-4" />} {...ticketsFact(events)} />
    </div>
  )
}
