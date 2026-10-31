import { Toaster as SonnerToaster, type ToasterProps } from 'sonner'
import { useTheme } from '@/components/layout/useTheme'

/**
 * Área dos avisos (toasts) do portal, com as cores dos tokens shadcn e o tema escolhido no menu do usuário.
 *
 * @param props - Propriedades do Toaster do Sonner.
 * @returns Toaster montado uma vez na raiz do app.
 */
function Toaster(props: ToasterProps) {
  const { theme } = useTheme()

  return (
    <SonnerToaster
      theme={theme === 'escuro' ? 'dark' : 'light'}
      className="toaster group"
      style={{
        '--normal-bg': 'var(--popover)',
        '--normal-text': 'var(--popover-foreground)',
        '--normal-border': 'var(--border)'
      } as React.CSSProperties}
      {...props}
    />
  )
}

export { Toaster }
