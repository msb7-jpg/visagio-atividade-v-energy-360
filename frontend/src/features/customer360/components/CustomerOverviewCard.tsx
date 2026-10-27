import type { ReactNode } from 'react'
import { Gauge, MapPin, Sun, User, Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip } from '@/components/ui/tooltip-card'
import type { CustomerSummary } from '@/features/customer360/types/customer360Types'
import { formatMonthOfDate, formatPower } from '@/features/customer360/utils/customer360Formatters'

const NOT_INFORMED = 'Não informado'

interface OverviewFieldProps {
  icon: ReactNode
  label: string
  primary: string
  secondary?: string | null
}

function OverviewField({ icon, label, primary, secondary }: OverviewFieldProps) {
  return (
    <div className="flex gap-3">
      <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-xl">
        {icon}
      </div>
      <div className="flex min-w-0 flex-col">
        <span className="text-muted-foreground text-xs font-semibold">{label}</span>
        <span className="text-foreground truncate text-sm font-semibold">{primary}</span>
        {secondary ? <span className="text-muted-foreground truncate text-xs">{secondary}</span> : null}
      </div>
    </div>
  )
}

function SolarBadge({ summary }: { summary: CustomerSummary }) {
  if (!summary.possui_gd) {
    return <Badge variant="outline">Sem geração própria</Badge>
  }
  return (
    <Tooltip content="A energia gerada pelo painel é abatida do consumo faturado; queda de consumo é esperada.">
      <Badge variant="secondary">
        <span className="flex items-center gap-1">
          <Sun className="size-3" /> GD Solar ({formatPower(summary.potencia_gd_kw)})
          {summary.data_conexao_gd ? ` · desde ${formatMonthOfDate(summary.data_conexao_gd)}` : null}
        </span>
      </Badge>
    </Tooltip>
  )
}

interface CustomerOverviewCardProps {
  summary: CustomerSummary
}

/**
 * Card com quem é o cliente: cadastro, circuito elétrico, medidor e geração solar.
 *
 * @param props - Cadastro da UC retornado por `/summary`.
 * @returns Card de resumo da UC.
 */
export function CustomerOverviewCard({ summary }: CustomerOverviewCardProps) {
  return (
    <Card variant="glass">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 pb-2">
        <CardTitle>
          <span className="font-mono">{summary.id_uc}</span>
        </CardTitle>
        <SolarBadge summary={summary} />
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <OverviewField
          icon={<User className="size-4" />}
          label="Titular"
          primary={summary.nome_titular ?? NOT_INFORMED}
          secondary={summary.codigo_cliente ? `Cliente ${summary.codigo_cliente}` : null}
        />
        <OverviewField
          icon={<MapPin className="size-4" />}
          label="Localização"
          primary={summary.bairro ?? NOT_INFORMED}
          secondary={summary.municipio}
        />
        <OverviewField
          icon={<Zap className="size-4" />}
          label="Classe e circuito"
          primary={[summary.classe_consumo, summary.subgrupo_tarifario].filter(Boolean).join(' · ') || NOT_INFORMED}
          secondary={summary.alimentador ? `Alimentador ${summary.alimentador}` : null}
        />
        <OverviewField
          icon={<Gauge className="size-4" />}
          label="Medidor instalado"
          primary={summary.numero_medidor_ativo ?? NOT_INFORMED}
        />
      </CardContent>
    </Card>
  )
}
