import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  /** Uma frase curta: o que a tela responde. */
  description?: ReactNode
  /** Ações da tela, alinhadas à direita do título. */
  actions?: ReactNode
}

/**
 * Cabeçalho padrão das telas do portal: título, uma frase de contexto e as ações da tela.
 *
 * @param props - Título, descrição e ações.
 * @returns Cabeçalho da página.
 */
export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="border-border flex flex-wrap items-end justify-between gap-4 border-b pb-5">
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className="text-foreground text-2xl font-semibold">{title}</h1>
        {description ? <p className="text-muted-foreground max-w-3xl text-sm">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}
