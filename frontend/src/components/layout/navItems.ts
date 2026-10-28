import { UserSearch, type LucideIcon } from 'lucide-react'

export interface NavItem {
  label: string
  path: string
  roles: readonly string[]
  icon?: LucideIcon
}

// Espelha `backend/app/shared/role_groups.py`; novas telas entram aqui, só por acréscimo.
export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Painel', path: '/dashboard', roles: ['diretor', 'gerente_operacao', 'gerente_perdas'] },
  {
    label: 'Visão 360 da UC',
    path: '/customers',
    roles: ['diretor', 'gerente_atendimento', 'atendente', 'gerente_perdas', 'gerente_operacao'],
    icon: UserSearch
  },
  { label: 'Gestão de Perdas', path: '/losses', roles: ['diretor', 'gerente_perdas'] },
  { label: 'Qualidade da Rede', path: '/quality', roles: ['diretor', 'gerente_operacao'] },
  { label: 'Inteligência Comercial', path: '/revenue', roles: ['diretor'] }
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
