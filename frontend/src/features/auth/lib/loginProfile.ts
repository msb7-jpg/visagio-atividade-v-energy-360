import { navItemsFor } from '@/components/layout/navItems'
import type { UserDTO } from '@/features/auth/utils/user'

const ROLE_LABELS: Readonly<Record<string, string>> = {
  diretor: 'Diretor Comercial',
  gerente_operacao: 'Gerente de Operação',
  gerente_atendimento: 'Gerente de Atendimento',
  atendente: 'Atendente',
  gerente_perdas: 'Gerente de Perdas'
}

export interface LoginProfile {
  firstName: string
  initials: string
  roleLabel: string
  homePath: string
  homeLabel: string
}

/**
 * Remove o cargo entre parênteses que o backend anexa ao nome (ex.: "Henrique Duarte (Diretor Comercial)").
 *
 * @param nome - Nome como vem no token.
 * @returns Só o nome da pessoa.
 */
export function personName(nome: string): string {
  const openingParenthesis = nome.indexOf('(')
  return (openingParenthesis === -1 ? nome : nome.slice(0, openingParenthesis)).trim()
}

/**
 * Iniciais (até duas letras) para o avatar.
 *
 * @param nome - Nome da pessoa.
 * @returns Iniciais em maiúsculas.
 */
export function initialsOf(nome: string): string {
  return personName(nome)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}

/**
 * Rótulo do cargo em português.
 *
 * @param role - Papel (`user.role`) do token.
 * @returns Rótulo conhecido, ou o próprio papel se não houver.
 */
export function roleLabel(role: string): string {
  return ROLE_LABELS[role] ?? role
}

/**
 * Resolve o que a tela de "logado" mostra. Cargo que não acessa nenhuma tela vai ao estado "sem perfil".
 *
 * @param user - Usuário devolvido pelo login.
 * @returns Perfil para exibição, ou `null` se o cargo não libera nenhuma tela.
 */
export function resolveProfile(user: UserDTO): LoginProfile | null {
  const home = navItemsFor(user.role)[0]
  if (!home) return null

  return {
    firstName: personName(user.nome).split(/\s+/)[0] ?? user.nome,
    initials: initialsOf(user.nome),
    roleLabel: roleLabel(user.role),
    homePath: home.path,
    homeLabel: home.label
  }
}
