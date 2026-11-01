import { act, fireEvent, render, screen } from '@testing-library/react'
import { AxiosError, type AxiosResponse } from 'axios'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LoginPage } from '@/features/auth/components/LoginPage'

const login = vi.fn()
const logout = vi.fn()

vi.mock('@/features/auth/hooks/useAuth', () => ({ useAuth: () => ({ login, logout }) }))

const MOTION_CLASS = /login-(anim|motion|spin)/
const STEP_MS = 400

const directorResponse = {
  user: { id: 'user-diretor', email: 'diretor@venergy.com', nome: 'Henrique Duarte (Diretor Comercial)', role: 'diretor' }
}

function setReducedMotion(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  }))
}

function renderLogin() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  )
}

function fillAndSubmit(email: string, senha: string) {
  fireEvent.change(screen.getByLabelText('E-mail corporativo'), { target: { value: email } })
  fireEvent.change(screen.getByLabelText('Senha'), { target: { value: senha } })
  fireEvent.submit(screen.getByLabelText('Senha').closest('form') as HTMLFormElement)
}

const advance = (milliseconds: number) => act(async () => {
  await vi.advanceTimersByTimeAsync(milliseconds)
})

describe('LoginPage', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    setReducedMotion(false)
    login.mockReset()
    logout.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllEnvs()
  })

  describe('formulário', () => {
    it('mostra os campos com rótulo, sem SSO, e foco no e-mail ao abrir', () => {
      renderLogin()

      expect(screen.getByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /SSO/ })).not.toBeInTheDocument()
      expect(screen.getByLabelText('Senha')).toBeInTheDocument()
      expect(screen.getByLabelText('E-mail corporativo')).toHaveFocus()
    })

    it('mostra o acesso de demonstração por padrão', () => {
      renderLogin()

      expect(screen.getByText('Acesso de demonstração')).toBeInTheDocument()
    })

    it('esconde o acesso de demonstração com VITE_DEMO_LOGIN=false', () => {
      vi.stubEnv('VITE_DEMO_LOGIN', 'false')
      renderLogin()

      expect(screen.queryByText('Acesso de demonstração')).not.toBeInTheDocument()
    })

    it('recusa e-mail fora do domínio com role="alert" e aria-invalid, sem chamar a API', () => {
      renderLogin()
      fillAndSubmit('alguem@gmail.com', 'venergy123')

      expect(screen.getByRole('alert')).toHaveTextContent('Use o seu e-mail corporativo @venergy.com.')
      expect(screen.getByLabelText('E-mail corporativo')).toHaveAttribute('aria-invalid', 'true')
      expect(login).not.toHaveBeenCalled()
    })

    it('pede a senha quando ela está vazia', () => {
      renderLogin()
      fillAndSubmit('diretor@venergy.com', '')

      expect(screen.getByRole('alert')).toHaveTextContent('Informe a senha.')
      expect(screen.getByLabelText('Senha')).toHaveAttribute('aria-invalid', 'true')
      expect(login).not.toHaveBeenCalled()
    })

    it('limpa o erro ao digitar de novo', () => {
      renderLogin()
      fillAndSubmit('alguem@gmail.com', 'venergy123')
      fireEvent.change(screen.getByLabelText('E-mail corporativo'), { target: { value: 'diretor@venergy.com' } })

      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('mostra o erro da API e volta ao formulário quando a credencial é recusada', async () => {
      login.mockRejectedValue(new AxiosError('falhou', 'ERR_BAD_REQUEST', undefined, undefined, { status: 401 } as AxiosResponse))
      renderLogin()
      fillAndSubmit('diretor@venergy.com', 'errada')
      await advance(STEP_MS)

      expect(screen.getByRole('alert')).toHaveTextContent('E-mail ou senha incorretos.')
      expect(screen.getByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
    })
  })

  describe('aguardando e logado', () => {
    it('avança os 3 passos acompanhando a resposta e termina no estado logado', async () => {
      login.mockResolvedValue(directorResponse)
      renderLogin()
      fillAndSubmit('Diretor@venergy.com', 'venergy123')
      await advance(0)

      expect(login).toHaveBeenCalledWith({ email: 'diretor@venergy.com', senha: 'venergy123' })
      expect(screen.getByRole('status')).toBeInTheDocument()
      expect(screen.getByText('Verificando e-mail e senha').closest('li')).toHaveAttribute('aria-current', 'step')

      await advance(STEP_MS)
      expect(screen.getByText('Lendo o seu cargo na conta').closest('li')).toHaveAttribute('aria-current', 'step')

      await advance(STEP_MS)
      expect(screen.getByText('Preparando o seu acesso').closest('li')).toHaveAttribute('aria-current', 'step')

      await advance(STEP_MS)
      expect(screen.getByRole('heading', { name: 'Olá, Henrique' })).toBeInTheDocument()
      expect(screen.getByText('Perfil Diretor Comercial')).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /Ir para Painel/ })).toHaveAttribute('href', '/dashboard')
    })

    it('volta ao formulário ao cancelar a espera', async () => {
      login.mockReturnValue(new Promise(() => undefined))
      renderLogin()
      fillAndSubmit('diretor@venergy.com', 'venergy123')
      await advance(0)
      fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

      expect(screen.getByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
    })

    it('encerra a sessão ao usar outra conta', async () => {
      login.mockResolvedValue(directorResponse)
      renderLogin()
      fillAndSubmit('diretor@venergy.com', 'venergy123')
      await advance(STEP_MS * 3)
      fireEvent.click(screen.getByRole('button', { name: 'Usar outra conta' }))

      expect(logout).toHaveBeenCalledTimes(1)
      expect(screen.getByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
    })
  })

  describe('sem perfil', () => {
    it('mostra o aviso quando o cargo não libera nenhuma tela', async () => {
      login.mockResolvedValue({
        user: { id: 'user-x', email: 'x@venergy.com', nome: 'Fulano', role: 'papel_desconhecido' }
      })
      renderLogin()
      fillAndSubmit('x@venergy.com', 'venergy123')
      await advance(STEP_MS * 3)

      expect(screen.getByRole('alert')).toHaveTextContent('Sua conta não tem perfil no Grid 360')
      expect(screen.getByRole('alert')).toHaveTextContent('x@venergy.com')
    })
  })

  describe('acesso de demonstração', () => {
    it('com VITE_DEMO_LOGIN ligada, lista as contas e entra com a escolhida', async () => {
      vi.stubEnv('VITE_DEMO_LOGIN', 'true')
      login.mockResolvedValue(directorResponse)
      renderLogin()

      expect(screen.getByText('Acesso de demonstração')).toBeInTheDocument()
      expect(screen.getAllByRole('button', { name: /Camila Barreto/ })).toHaveLength(2)

      fireEvent.click(screen.getByRole('button', { name: /Rafael Coutinho/ }))
      await advance(0)

      expect(login).toHaveBeenCalledWith({ email: 'perdas@venergy.com', senha: 'venergy123' })
    })
  })

  describe('movimento', () => {
    it('aplica as classes de movimento por padrão', async () => {
      login.mockResolvedValue(directorResponse)
      const { container } = renderLogin()

      expect(container.querySelector('.login-motion')).not.toBeNull()
      fillAndSubmit('diretor@venergy.com', 'venergy123')
      await advance(0)

      expect(container.querySelector('.login-spin')).not.toBeNull()
    })

    it('com prefers-reduced-motion nenhuma classe de movimento é aplicada, em nenhum estado', async () => {
      setReducedMotion(true)
      login.mockResolvedValue(directorResponse)
      const { container } = renderLogin()

      expect(container.innerHTML).not.toMatch(MOTION_CLASS)

      fillAndSubmit('alguem@gmail.com', 'venergy123')
      expect(container.innerHTML).not.toMatch(MOTION_CLASS)

      fillAndSubmit('diretor@venergy.com', 'venergy123')
      await advance(0)
      expect(screen.getByRole('status')).toBeInTheDocument()
      expect(container.innerHTML).not.toMatch(MOTION_CLASS)

      await advance(STEP_MS * 3)
      expect(screen.getByRole('heading', { name: 'Olá, Henrique' })).toBeInTheDocument()
      expect(container.innerHTML).not.toMatch(MOTION_CLASS)
    })
  })
})
