import { Zap, Activity, Users, FileSearch } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { SmartInsightCard } from '@/features/insights/SmartInsightCard'

/**
 * Dashboard principal com visão geral analítica (design.md).
 * Estruturado com cartões de métricas em 12px de raio, tokens semânticos e paleta corporativa.
 *
 * @returns Elemento DashboardPage renderizado.
 */
export function DashboardPage() {
  return (
    <div>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <h2 className="text-foreground text-xl font-bold">Painel de Controle</h2>
          <p className="text-muted-foreground text-sm">
            Ambiente inicial conectado com sucesso. Módulos analíticos prontos para consumo dos dados Gold.
          </p>
        </div>

        <SmartInsightCard
          context="revenue"
          metrics={{
            faturamento_total_rs: 85200000,
            volume_faturado_mwh: 98400,
            penetracao_gd_mwp: 14.8,
            dec: 4.8,
            fec: 2.1
          }}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card variant="interactive">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Diagnóstico de Receita</CardTitle>
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <Zap className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-foreground text-2xl font-bold tracking-tight">Preço x Volume</div>
              <CardDescription className="mt-1">
                Visualização por bairro e classe de consumo (Henrique Duarte).
              </CardDescription>
            </CardContent>
          </Card>

          <Card variant="interactive">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Visão 360 da UC</CardTitle>
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <Users className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-foreground text-2xl font-bold tracking-tight">Atendimento Ágil</div>
              <CardDescription className="mt-1">
                Histórico de faturas, consumo e chamados em tela única (Camila Barreto).
              </CardDescription>
            </CardContent>
          </Card>

          <Card variant="interactive">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Fila de Perdas</CardTitle>
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <FileSearch className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-foreground text-2xl font-bold tracking-tight">Inspeções</div>
              <CardDescription className="mt-1">
                Priorização de suspeitas e ordens de serviço (Rafael Coutinho).
              </CardDescription>
            </CardContent>
          </Card>

          <Card variant="interactive">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Qualidade da Rede</CardTitle>
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <Activity className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-foreground text-2xl font-bold tracking-tight">DEC & FEC ANEEL</div>
              <CardDescription className="mt-1">
                Indicadores regulatórios por alimentador (Beatriz Farias).
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
