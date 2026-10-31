import { describe, expect, it } from 'vitest'
import { initialsOf, personName, resolveProfile, roleLabel } from '@/features/auth/lib/loginProfile'

const user = (nome: string, role: string) => ({ id: 'user-x', email: 'x@venergy.com', nome, role })

describe('loginProfile', () => {
  it('tira o cargo entre parênteses do nome', () => {
    expect(personName('Henrique Duarte (Diretor Comercial)')).toBe('Henrique Duarte')
    expect(personName('Camila Barreto')).toBe('Camila Barreto')
  })

  it('gera iniciais de até duas letras', () => {
    expect(initialsOf('Henrique Duarte (Diretor Comercial)')).toBe('HD')
    expect(initialsOf('Beatriz')).toBe('B')
  })

  it('traduz o papel do backend em rótulo de cargo', () => {
    expect(roleLabel('gerente_perdas')).toBe('Gerente de Perdas')
    expect(roleLabel('papel_novo')).toBe('papel_novo')
  })

  it('leva o diretor ao Painel', () => {
    expect(resolveProfile(user('Henrique Duarte (Diretor Comercial)', 'diretor'))).toEqual({
      firstName: 'Henrique',
      initials: 'HD',
      roleLabel: 'Diretor Comercial',
      homePath: '/dashboard',
      homeLabel: 'Painel'
    })
  })

  it('leva o gerente de perdas à Fila de Inspeção', () => {
    expect(resolveProfile(user('Rafael Coutinho (Gerente de Perdas)', 'gerente_perdas'))).toMatchObject({
      homePath: '/losses',
      homeLabel: 'Fila de Inspeção'
    })
  })

  it('devolve null para cargo que não acessa nenhuma tela', () => {
    expect(resolveProfile(user('Fulano', 'papel_desconhecido'))).toBeNull()
  })
})
