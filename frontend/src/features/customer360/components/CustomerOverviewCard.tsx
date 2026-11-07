import { Sun } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Tooltip } from '@/components/ui/tooltip-card'
import type { CustomerSummary } from '@/features/customer360/types/customer360Types'
import { formatMonthOfDate, formatPower } from '@/features/customer360/utils/customer360Formatters'
import { displayName } from '@/lib/geo/placeName'

const NOT_INFORMED = 'Não informado'

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

function Fact({ label, children }: { label: string; children: string }) {
  return (
    <div className="flex min-w-0 flex-col">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="text-foreground text-sm font-medium">{children}</dd>
    </div>
  )
}

/**
 * Identificação da UC no topo da ficha: número em destaque, titular e os dados de cadastro numa linha.
 *
 * @param props - Cadastro da UC retornado por `/summary`.
 * @returns Bloco de identificação sem moldura própria (fica dentro da faixa do topo).
 */
export function CustomerOverviewCard({ summary }: { summary: CustomerSummary }) {
  const place = [summary.bairro, summary.municipio].filter(Boolean).map((name) => displayName(String(name))).join(', ') || NOT_INFORMED
  const consumerClass = summary.classe_consumo ? displayName(summary.classe_consumo) : null
  const tariffClass = [consumerClass, summary.subgrupo_tarifario].filter(Boolean).join(' · ') || NOT_INFORMED
  return (
    <section aria-label="Identificação da UC" className="flex min-w-0 flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-foreground font-mono text-2xl font-semibold">{summary.id_uc}</span>
        <SolarBadge summary={summary} />
      </div>
      <p className="text-foreground text-base font-medium">
        {summary.nome_titular ?? NOT_INFORMED}
        {summary.codigo_cliente ? <span className="text-muted-foreground font-normal"> · Cliente {summary.codigo_cliente}</span> : null}
      </p>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4">
        <Fact label="Localização">{place}</Fact>
        <Fact label="Classe">{tariffClass}</Fact>
        <Fact label="Circuito">{summary.alimentador ? `Alimentador ${summary.alimentador}` : NOT_INFORMED}</Fact>
        <Fact label="Medidor">{summary.numero_medidor_ativo ?? NOT_INFORMED}</Fact>
      </dl>
    </section>
  )
}
