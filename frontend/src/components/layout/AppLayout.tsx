import { Suspense } from 'react'
import { ChevronRight } from 'lucide-react'
import { Outlet, useLocation } from 'react-router-dom'
import { LoadingSkeleton } from '@/components/feedback/LoadingSkeleton'
import { BrandMark } from '@/components/layout/BrandMark'
import { CaseQuestionButton } from '@/components/layout/CaseQuestionButton'
import { navItemForPath } from '@/components/layout/navItems'
import { SidebarNav } from '@/components/layout/SidebarNav'
import { UserMenu } from '@/components/layout/UserMenu'
import { ChatDrawer } from '@/features/chat/ChatDrawer'

function PageLoading() {
  return (
    <div className="flex w-full flex-col gap-4 px-4 py-8 sm:px-6">
      <LoadingSkeleton count={4} className="h-24" />
    </div>
  )
}

/** Trilha do cabeçalho: área do menu e tela atual. */
function HeaderTrail() {
  const { pathname } = useLocation()
  const current = navItemForPath(pathname)
  if (!current) return <BrandMark className="md:hidden" />

  return (
    <p className="flex min-w-0 items-center gap-1.5 text-sm">
      <span className="text-muted-foreground hidden sm:inline">{current.group}</span>
      <ChevronRight aria-hidden="true" className="text-muted-foreground hidden size-3.5 sm:inline" />
      <span className="text-foreground truncate font-medium">{current.label}</span>
    </p>
  )
}

/**
 * Shell do portal: menu lateral por cargo, cabeçalho com a trilha da tela e o menu do usuário, e a tela ativa.
 *
 * As telas são carregadas sob demanda; enquanto o arquivo da tela chega, o shell continua visível com um esqueleto.
 *
 * @returns Layout com `<Outlet />` para as rotas protegidas.
 */
export function AppLayout() {
  return (
    <div className="bg-background flex min-h-dvh">
      <aside className="border-border bg-sidebar sticky top-0 hidden h-dvh w-72 shrink-0 flex-col gap-8 self-start overflow-y-auto border-r px-4 py-5 md:flex">
        <BrandMark className="px-3" />
        <SidebarNav />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-border bg-card sticky top-0 z-40 flex h-14 items-center justify-between gap-3 border-b px-4 sm:px-6">
          <HeaderTrail />
          <div className="flex items-center gap-2">
            <CaseQuestionButton />
            <ChatDrawer />
            <UserMenu />
          </div>
        </header>
        <div className="min-w-0 flex-1 pb-16">
          <Suspense fallback={<PageLoading />}>
            <Outlet />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
