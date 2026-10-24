import { navItemsFor } from '@/components/layout/navItems'

/**
 * Tela inicial do cargo: a primeira do menu a que ele tem acesso.
 *
 * @param role - Papel (`user.role`) do usuário logado.
 * @returns Caminho da tela inicial, ou `/login` se o papel não acessa nenhuma tela.
 */
export function homeRouteFor(role: string): string {
  return navItemsFor(role)[0]?.path ?? '/login'
}
