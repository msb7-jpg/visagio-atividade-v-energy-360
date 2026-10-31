import { useState } from 'react'
import { ChevronDown, LogOut, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { describeProfile } from '@/components/layout/userMenuProfile'
import { useTheme } from '@/components/layout/useTheme'
import { initialsOf, personName } from '@/features/auth/lib/loginProfile'
import { useAuth } from '@/features/auth/hooks/useAuth'

/**
 * Menu do usuário do cabeçalho: dados da conta, alternar tema e Sair.
 * O nome e o cargo vêm da conta autenticada; a troca de perfil de demonstração fica só na tela de login.
 *
 * @returns Botão do avatar com o menu suspenso, ou nada se não houver sessão.
 */
export function UserMenu() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [announcement, setAnnouncement] = useState('')

  if (!user) return null

  const name = personName(user.nome)
  const profileLine = describeProfile(user)
  const isDark = theme === 'dark'
  const ThemeIcon = isDark ? Sun : Moon

  const handleToggleTheme = () => {
    toggleTheme()
    setAnnouncement(isDark ? 'Modo claro ativado' : 'Modo escuro ativado')
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="touch" className="group" aria-label={`Menu do usuário ${name}`}>
            <span className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-full text-xs font-bold">
              {initialsOf(user.nome)}
            </span>
            <span className="hidden flex-col text-left sm:flex">
              <span className="text-foreground text-sm leading-tight font-semibold">{name}</span>
              <span className="text-muted-foreground text-xs font-medium">{profileLine}</span>
            </span>
            <ChevronDown
              aria-hidden="true"
              className="transition-transform duration-150 group-data-[state=open]:rotate-180 motion-reduce:transition-none"
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>
            <p className="text-foreground text-base font-semibold break-words">{name}</p>
            <p className="text-muted-foreground text-sm break-words">{profileLine}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={handleToggleTheme}>
            <ThemeIcon key={theme} aria-hidden="true" className="theme-icon-swap" />
            {isDark ? 'Usar modo claro' : 'Usar modo escuro'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={logout}>
            <LogOut aria-hidden="true" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <span role="status" className="sr-only">{announcement}</span>
    </>
  )
}
