import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { UserMenu } from '@/components/layout/UserMenu'
import { AuthProvider } from '@/features/auth/context/AuthProvider'

const TOKEN_KEY = 'venergy_access_token'
const assign = vi.fn()
const originalLocation = window.location

function fakeJwt(payload: Record<string, unknown>): string {
  const encode = (part: object) => btoa(JSON.stringify(part)).replaceAll('=', '')
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(payload)}.assinatura`
}

describe('UserMenu com sessão real', () => {
  beforeEach(() => {
    assign.mockReset()
    Object.defineProperty(window, 'location', { value: { assign }, writable: true, configurable: true })
    localStorage.setItem(
      TOKEN_KEY,
      fakeJwt({
        sub: 'user-diretor',
        email: 'diretor@venergy.com',
        nome: 'Henrique Duarte (Diretor Comercial)',
        role: 'diretor',
        exp: Math.floor(Date.now() / 1000) + 3600
      })
    )
  })

  afterEach(() => {
    Object.defineProperty(window, 'location', { value: originalLocation, writable: true, configurable: true })
    localStorage.clear()
  })

  it('Sair limpa o token e leva ao login', async () => {
    render(
      <AuthProvider>
        <UserMenu />
      </AuthProvider>
    )

    fireEvent.keyDown(screen.getByRole('button', { name: 'Menu do usuário Henrique Duarte' }), { key: 'Enter' })
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Sair' }))

    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
    expect(assign).toHaveBeenCalledWith('/login')
  })
})
