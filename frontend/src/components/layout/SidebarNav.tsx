import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { navItemsFor } from '@/components/layout/navItems'
import { useAuth } from '@/features/auth/hooks/useAuth'

/**
 * Menu lateral que lista apenas as telas permitidas ao cargo logado, numa lista única.
 *
 * @returns Navegação com um link por tela autorizada.
 */
export function SidebarNav() {
  const { user } = useAuth()
  const links = navItemsFor(user?.role ?? '')

  return (
    <nav aria-label="Navegação principal" className="flex flex-col gap-1">
      {links.map((navLink) => (
        <NavLink
          key={navLink.path}
          to={navLink.path}
          className={({ isActive }) =>
            cn(
              'relative flex items-center gap-3 rounded-md px-3 py-2.5 text-base font-medium transition-colors',
              isActive
                ? 'bg-card text-foreground shadow-sm ring-1 ring-border before:bg-brand before:absolute before:inset-y-2 before:left-0 before:w-1 before:rounded-full'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
        >
          {navLink.icon ? <navLink.icon aria-hidden="true" className="size-5 shrink-0" /> : null}
          {navLink.label}
        </NavLink>
      ))}
    </nav>
  )
}
