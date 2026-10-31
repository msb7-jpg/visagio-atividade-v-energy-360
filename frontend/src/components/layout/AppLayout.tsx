import { Suspense } from 'react'
import { Zap } from 'lucide-react'
import { Outlet } from 'react-router-dom'
import { LoadingSkeleton } from '@/components/feedback/LoadingSkeleton'
import { Separator } from '@/components/ui/separator'
import { SidebarNav } from '@/components/layout/SidebarNav'
import { UserMenu } from '@/components/layout/UserMenu'
import { ChatDrawer } from '@/features/chat/ChatDrawer'

function PageLoading() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:px-6">
      <LoadingSkeleton count={4} className="h-24" />
    </div>
  )
}

/**
 * Shell do portal: cabeçalho com o menu do usuário, menu lateral fixo por cargo e a tela ativa.
 *
 * As telas são carregadas sob demanda; enquanto o arquivo da tela chega, o shell continua visível com um esqueleto.
 *
 * @returns Layout com `<Outlet />` para as rotas protegidas.
 */
export function AppLayout() {
  return (
    <div className="bg-background flex min-h-dvh">
      <aside className="border-foreground/10 bg-card/50 backdrop-blur-2xl sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-4 self-start overflow-y-auto border-r p-4 md:flex shadow-2xl">
        <div className="flex items-center gap-2.5 px-2 py-1">
          <div className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-lg shadow-sm">
            <Zap className="size-5" />
          </div>
          <span className="text-foreground text-base font-bold tracking-tight">V-Energy 360</span>
        </div>
        <Separator />
        <SidebarNav />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-foreground/10 bg-card/50 backdrop-blur-2xl sticky top-0 z-40 flex items-center justify-end gap-3 border-b px-6 py-2.5 shadow-sm">
          <div className="flex items-center gap-3">
            <ChatDrawer />
            <div className="pl-3 border-l border-foreground/10">
              <UserMenu />
            </div>
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
