import { LogOut, Zap, Activity, Users, FileSearch } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/features/auth/hooks/useAuth'

/**
 * Dashboard principal com visão geral analítica (design.md).
 * Estruturado com cartões de métricas em 12px de raio, tokens semânticos e paleta corporativa.
 *
 * @returns Elemento DashboardPage renderizado.
 */
export function DashboardPage() {
  const { user, logout } = useAuth()

  return (
    <div className="bg-background min-h-dvh">
      <header className="border-border bg-card/90 backdrop-blur-md border-b sticky top-0 z-40">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-xl shadow-sm">
              <Zap className="size-5" />
            </div>
            <div>
              <h1 className="text-foreground text-base font-bold">V-Energy Grid 360</h1>
              <p className="text-muted-foreground text-xs">Portal Integrado de Operações e Inteligência</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-right">
              <div>
                <p className="text-foreground text-sm font-semibold">{user?.nome}</p>
                <div className="flex items-center justify-end gap-1.5">
                  <Badge variant="secondary">{user?.role}</Badge>
                  <span className="text-muted-foreground text-xs">{user?.email}</span>
                </div>
              </div>
            </div>

            <Button variant="outline" size="sm" onClick={logout}>
              <span className="flex items-center gap-1.5">
                <LogOut className="size-3.5" /> Sair
              </span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <h2 className="text-foreground text-xl font-bold">Painel de Controle</h2>
          <p className="text-muted-foreground text-sm">
            Ambiente inicial conectado com sucesso. Módulos analíticos prontos para consumo dos dados Gold.
          </p>
        </div>

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
