import { AxiosError, type AxiosResponse } from 'axios'
import { describe, expect, it } from 'vitest'
import { loginErrorMessage, validateLogin } from '@/features/auth/lib/loginValidation'

const failedWith = (status: number) =>
  new AxiosError('falhou', 'ERR_BAD_REQUEST', undefined, undefined, { status } as AxiosResponse)

describe('validateLogin', () => {
  it('aceita e-mail corporativo e senha preenchida', () => {
    expect(validateLogin('diretor@venergy.com', 'venergy123')).toBeNull()
  })

  it('ignora maiúsculas e espaços ao redor do e-mail', () => {
    expect(validateLogin('  Diretor@Venergy.com ', 'venergy123')).toBeNull()
  })

  it.each(['', 'diretor', 'diretor@gmail.com', 'diretor@venergy.com.br', 'a b@venergy.com'])(
    'recusa o e-mail "%s" com erro no campo de e-mail',
    (email) => {
      expect(validateLogin(email, 'venergy123')).toEqual({
        field: 'email',
        message: 'Use o seu e-mail corporativo @venergy.com.'
      })
    }
  )

  it('pede a senha quando está vazia', () => {
    expect(validateLogin('diretor@venergy.com', '')).toEqual({ field: 'senha', message: 'Informe a senha.' })
  })
})

describe('loginErrorMessage', () => {
  it('traduz 401 como credencial incorreta', () => {
    expect(loginErrorMessage(failedWith(401))).toBe('E-mail ou senha incorretos.')
  })

  it('avisa quando o servidor não responde', () => {
    expect(loginErrorMessage(new AxiosError('Network Error', 'ERR_NETWORK'))).toBe(
      'Não foi possível falar com o servidor. Tente de novo.'
    )
  })

  it('usa mensagem genérica nos demais erros, sem vazar detalhe técnico', () => {
    expect(loginErrorMessage(failedWith(500))).toBe('Falha ao autenticar. Tente de novo.')
    expect(loginErrorMessage(new Error('boom'))).toBe('Falha ao autenticar. Tente de novo.')
  })
})
