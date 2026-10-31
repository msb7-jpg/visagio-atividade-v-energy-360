import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { UserMenu } from '@/components/layout/UserMenu'

const logout = vi.fn()
const directorUser = {
  id: 'user-diretor',
  email: 'diretor@venergy.com',
  nome: 'Henrique Duarte (Diretor Comercial)',
  role: 'diretor'
}

vi.mock('@/features/auth/hooks/useAuth', () => ({ useAuth: () => ({ user: directorUser, logout }) }))

const triggerName = 'Menu do usuário Henrique Duarte'

function openMenu() {
  const trigger = screen.getByRole('button', { name: triggerName })
  fireEvent.keyDown(trigger, { key: 'Enter' })
  return trigger
}

describe('UserMenu', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.className = 'dark'
    logout.mockReset()
  })

  it('abre com Enter e mostra nome, cargo e perfil, tema e Sair', async () => {
    render(<UserMenu />)

    const trigger = openMenu()

    expect(trigger).toHaveAttribute('aria-haspopup', 'menu')
    expect(await screen.findByRole('menu')).toBeInTheDocument()
    expect(screen.getAllByText('Henrique Duarte').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Diretor Comercial · perfil Diretoria').length).toBeGreaterThan(0)
    expect(screen.getByRole('menuitem', { name: 'Usar modo claro' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Sair' })).toBeInTheDocument()
  })

  it('não mostra aviso de demonstração nem troca de perfil', async () => {
    render(<UserMenu />)

    openMenu()
    await screen.findByRole('menu')

    expect(screen.queryByText(/Modo demonstração/)).not.toBeInTheDocument()
    expect(screen.queryAllByRole('menuitemradio')).toHaveLength(0)
  })

  it('fecha com Esc e devolve o foco ao botão', async () => {
    render(<UserMenu />)
    const trigger = openMenu()
    const menu = await screen.findByRole('menu')

    fireEvent.keyDown(menu, { key: 'Escape' })

    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())
    expect(trigger).toHaveFocus()
  })

  it('fecha ao clicar fora', async () => {
    render(<UserMenu />)
    openMenu()
    await screen.findByRole('menu')

    fireEvent.pointerDown(document.body)

    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())
  })

  it('alterna o tema: grava em grid360.tema, aplica, fecha o menu e anuncia', async () => {
    render(<UserMenu />)
    openMenu()

    fireEvent.click(await screen.findByRole('menuitem', { name: 'Usar modo claro' }))

    expect(localStorage.getItem('grid360.tema')).toBe('claro')
    expect(document.documentElement).not.toHaveClass('dark')
    expect(screen.getByRole('status')).toHaveTextContent('Modo claro ativado')
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())

    openMenu()

    expect(await screen.findByRole('menuitem', { name: 'Usar modo escuro' })).toBeInTheDocument()
  })

  it('chama o logout ao escolher Sair', async () => {
    render(<UserMenu />)
    openMenu()

    fireEvent.click(await screen.findByRole('menuitem', { name: 'Sair' }))

    expect(logout).toHaveBeenCalledTimes(1)
  })
})
