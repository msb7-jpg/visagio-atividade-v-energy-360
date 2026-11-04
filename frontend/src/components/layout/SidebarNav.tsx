import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { navItemsFor, type NavGroup, type NavItem } from '@/components/layout/navItems'
import { useAuth } from '@/features/auth/hooks/useAuth'

function groupItems(items: NavItem[]): [NavGroup, NavItem[]][] {
  const groups = new Map<NavGroup, NavItem[]>()
  for (const navItem of items) {
    groups.set(navItem.group, [...(groups.get(navItem.group) ?? []), navItem])
  }
  return [...groups.entries()]
}

/**
 * Menu lateral que lista apenas as telas permitidas ao cargo logado, agrupadas por área.
 *
 * @returns Navegação com um link por tela autorizada.
 */
export function SidebarNav() {
  const { user } = useAuth()
  const groups = groupItems(navItemsFor(user?.role ?? ''))

  return (
    <nav aria-label="Navegação principal" className="flex flex-col gap-5">
      {groups.map(([groupName, groupLinks]) => (
        <div key={groupName} className="flex flex-col gap-0.5">
          <p className="text-muted-foreground px-2.5 pb-1 text-xs font-medium">{groupName}</p>
          {groupLinks.map((navLink) => (
            <NavLink
              key={navLink.path}
              to={navLink.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-card text-foreground shadow-sm ring-1 ring-border'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
            >
              {navLink.icon ? <navLink.icon aria-hidden="true" className="size-4 shrink-0" /> : null}
              {navLink.label}
            </NavLink>
          ))}
        </div>
      ))}
    </nav>
  )
}
