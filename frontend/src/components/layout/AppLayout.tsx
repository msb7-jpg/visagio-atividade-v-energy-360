import { LogOut, Zap } from 'lucide-react'
import { Outlet } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { SidebarNav } from '@/components/layout/SidebarNav'
import { useAuth } from '@/features/auth/hooks/useAuth'

/**
 * Shell do portal: cabeçalho com usuário e logout, menu lateral por cargo e a tela ativa.
 *
 * @returns Layout com `<Outlet />` para as rotas protegidas.
 */
export function AppLayout() {
  const { user, logout } = useAuth()

  return (
    <div className="bg-background flex min-h-dvh">
      <aside className="border-border bg-card hidden w-60 shrink-0 flex-col gap-4 border-r p-4 md:flex">
        <div className="flex items-center gap-2">
          <div className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-xl">
            <Zap className="size-5" />
          </div>
          <span className="text-foreground text-sm font-bold">V-Energy Grid 360</span>
        </div>
        <Separator />
        <SidebarNav />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-border bg-card/90 sticky top-0 z-40 flex items-center justify-end gap-3 border-b px-4 py-3 backdrop-blur-md">
          {/* Ponto de encaixe do botão do ChatDrawer (Fatia 07). */}
          <div className="text-right">
            <p className="text-foreground text-sm font-semibold">{user?.nome}</p>
            <Badge variant="secondary">{user?.role}</Badge>
          </div>
          <Button variant="outline" size="sm" onClick={logout}>
            <span className="flex items-center gap-1.5">
              <LogOut className="size-3.5" /> Sair
            </span>
          </Button>
        </header>
        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
