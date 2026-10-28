import { Suspense } from 'react'
import { LogOut, ShieldCheck, Zap } from 'lucide-react'
import { Outlet } from 'react-router-dom'
import { LoadingSkeleton } from '@/components/feedback/LoadingSkeleton'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tooltip } from '@/components/ui/tooltip-card'
import { SidebarNav } from '@/components/layout/SidebarNav'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { ChatDrawer } from '@/features/chat/ChatDrawer'

function PageLoading() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:px-6">
      <LoadingSkeleton count={4} className="h-24" />
    </div>
  )
}

/**
 * Shell do portal: cabeçalho com usuário e logout, menu lateral fixo por cargo e a tela ativa.
 *
 * As telas são carregadas sob demanda; enquanto o arquivo da tela chega, o shell continua visível com um esqueleto.
 *
 * @returns Layout com `<Outlet />` para as rotas protegidas.
 */
export function AppLayout() {
  const { user, logout } = useAuth()
  const rawName = user?.nome ?? 'Usuário'
  const cleanName = rawName.includes('(') ? rawName.split('(')[0].trim() : rawName

  return (
    <div className="bg-background flex min-h-dvh">
      <aside className="border-white/10 bg-card/50 backdrop-blur-2xl sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-4 self-start overflow-y-auto border-r p-4 md:flex shadow-2xl">
        <div className="flex items-center gap-2.5 px-2 py-1">
          <div className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-lg shadow-sm">
            <Zap className="size-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-foreground text-sm font-bold tracking-tight">V-Energy Grid 360</span>
            <span className="text-muted-foreground text-xs uppercase tracking-wider font-medium">Plataforma Smart Grid</span>
          </div>
        </div>
        <Separator />
        <SidebarNav />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-white/10 bg-card/50 backdrop-blur-2xl sticky top-0 z-40 flex items-center justify-between gap-3 border-b px-6 py-2.5 shadow-sm">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="size-2 rounded-full bg-success inline-block shadow-xs animate-pulse" />
            <span className="font-medium text-foreground/80">Rede Elétrica Conectada</span>
          </div>

          <div className="flex items-center gap-3">
            <ChatDrawer />
            <div className="flex items-center gap-2.5 pl-3 border-l border-white/10">
              <div className="text-right">
                <p className="text-foreground text-sm font-semibold leading-tight">{cleanName}</p>
                <p className="text-muted-foreground text-xs font-medium">{user?.role?.toUpperCase()}</p>
              </div>
              <Tooltip content={`${user?.nome} • Cargo: ${user?.role?.toUpperCase()}`}>
                <div className="flex size-7 items-center justify-center rounded-md bg-primary/15 text-primary border border-primary/25 cursor-help">
                  <ShieldCheck className="size-4" />
                </div>
              </Tooltip>
            </div>
            <Button variant="outline" size="sm" onClick={logout}>
              <span className="flex items-center gap-1.5">
                <LogOut className="size-3.5" /> Sair
              </span>
            </Button>
          </div>
        </header>
        <div className="min-w-0 flex-1">
          <Suspense fallback={<PageLoading />}>
            <Outlet />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
