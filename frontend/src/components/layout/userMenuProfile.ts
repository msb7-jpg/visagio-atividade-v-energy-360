import { roleLabel } from '@/features/auth/lib/loginProfile'
import type { UserDTO } from '@/features/auth/utils/user'

const PROFILE_LABELS: Readonly<Record<string, string>> = {
  diretor: 'Diretoria',
  gerente_atendimento: 'Atendimento',
  atendente: 'Atendimento',
  gerente_perdas: 'Perdas',
  gerente_operacao: 'Operação'
}

/**
 * Nome do perfil de acesso (área do portal) a que o papel pertence.
 *
 * @param role - Papel (`user.role`) do token.
 * @returns Perfil em português, ou o próprio papel se não houver rótulo.
 */
function profileOf(role: string): string {
  return PROFILE_LABELS[role] ?? role
}

/**
 * Cargo da pessoa: o texto entre parênteses do nome (ex.: "Henrique Duarte (Diretor Comercial)").
 *
 * @param user - Usuário autenticado.
 * @returns Cargo do nome, ou o rótulo do papel quando o nome não traz parênteses.
 */
function cargoOf(user: UserDTO): string {
  const opening = user.nome.lastIndexOf('(')
  const closing = user.nome.lastIndexOf(')')
  const cargo = opening !== -1 && closing > opening ? user.nome.slice(opening + 1, closing).trim() : ''
  return cargo || roleLabel(user.role)
}

/**
 * Linha "cargo · perfil" do cabeçalho do menu (por exemplo, "Diretor Comercial · perfil Diretoria"). Quando cargo e perfil coincidem, mostra só o perfil.
 *
 * @param user - Usuário autenticado.
 * @returns Texto da linha.
 */
export function describeProfile(user: UserDTO): string {
  const cargo = cargoOf(user)
  const perfil = profileOf(user.role)
  return cargo === perfil ? `Perfil ${perfil}` : `${cargo} · perfil ${perfil}`
}
