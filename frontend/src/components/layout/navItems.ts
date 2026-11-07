import {
  Activity,
  LayoutDashboard,
  ShieldAlert,
  TrendingUp,
  UserSearch,
  type LucideIcon
} from 'lucide-react'

/** Área do menu lateral em que a tela aparece. */
export type NavGroup = 'Diretoria' | 'Operação' | 'Atendimento'

export interface NavItem {
  label: string
  path: string
  roles: readonly string[]
  group: NavGroup
  icon?: LucideIcon
}

// Espelha `backend/app/shared/role_groups.py`; a ordem define a tela inicial de cada cargo (`homeRouteFor`).
export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Painel', path: '/dashboard', roles: ['diretor'], group: 'Diretoria', icon: LayoutDashboard },
  { label: 'Inteligência Comercial', path: '/revenue', roles: ['diretor'], group: 'Diretoria', icon: TrendingUp },
  { label: 'Fila de Inspeção', path: '/losses', roles: ['diretor', 'gerente_perdas'], group: 'Operação', icon: ShieldAlert },
  { label: 'Qualidade da Rede', path: '/quality', roles: ['diretor', 'gerente_operacao'], group: 'Operação', icon: Activity },
  {
    label: 'UC 360',
    path: '/customers',
    roles: ['diretor', 'gerente_atendimento', 'atendente', 'gerente_perdas', 'gerente_operacao'],
    group: 'Atendimento',
    icon: UserSearch
  }
]

/**
 * Itens de menu que o papel informado pode acessar.
 *
 * @param role - Papel (`user.role`) do usuário logado.
 * @returns Itens autorizados, na ordem do menu.
 */
export function navItemsFor(role: string): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role))
}

/**
 * Item de menu da rota atual (o mais específico que casa com o caminho).
 *
 * @param pathname - Caminho atual (`location.pathname`).
 * @returns Item correspondente, ou `undefined` fora das telas do menu.
 */
export function navItemForPath(pathname: string): NavItem | undefined {
  return NAV_ITEMS.find((item) => pathname === item.path || pathname.startsWith(`${item.path}/`))
}
