import { Toaster as SonnerToaster, type ToasterProps } from 'sonner'

/**
 * Tema do aviso conforme a classe do `<html>` (o app usa `class="dark"`, com o escuro como padrão).
 *
 * @returns Tema atual para o Sonner.
 */
function readTheme(): ToasterProps['theme'] {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

/**
 * Área dos avisos (toasts) do portal, com as cores dos tokens shadcn.
 *
 * @param props - Propriedades do Toaster do Sonner.
 * @returns Toaster montado uma vez na raiz do app.
 */
function Toaster(props: ToasterProps) {
  return (
    <SonnerToaster
      theme={readTheme()}
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
