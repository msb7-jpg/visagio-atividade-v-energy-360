import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { navItemsFor } from '@/components/layout/navItems'
import { useAuth } from '@/features/auth/hooks/useAuth'

/**
 * Menu lateral que lista apenas as telas permitidas ao cargo logado.
 *
 * @returns Navegação com um link por tela autorizada.
 */
export function SidebarNav() {
  const { user } = useAuth()
  const items = navItemsFor(user?.role ?? '')

  return (
    <nav aria-label="Navegação principal" className="flex flex-col gap-1">
      {items.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            cn(
              'rounded-xl px-3 py-2 text-sm font-medium transition-colors',
              isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
        >
          <span className="flex items-center gap-2">
            {item.icon ? <item.icon className="size-4" /> : null}
            {item.label}
          </span>
        </NavLink>
      ))}
    </nav>
  )
}
