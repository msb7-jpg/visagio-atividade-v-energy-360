import type { ReactNode } from 'react'

interface Customer360SectionProps {
  id: string
  title: string
  description?: string
  icon: ReactNode
  children: ReactNode
}

/**
 * Bloco semântico da Visão 360 ("Cliente e consumo", "Histórico financeiro", "Problemas técnicos"):
 * título, uma linha sobre o que o bloco responde e o conteúdo, sempre visível.
 *
 * @param props - Identificador do título, textos, ícone e conteúdo do bloco.
 * @returns Seção com título acessível.
 */
export function Customer360Section({ id, title, description, icon, children }: Customer360SectionProps) {
  return (
    <section aria-labelledby={id} className="flex min-w-0 flex-col gap-3">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 id={id} className="text-muted-foreground flex items-center gap-2 text-xs font-semibold tracking-wide uppercase">
          <span aria-hidden="true">{icon}</span>
          {title}
        </h2>
        {description ? <p className="text-muted-foreground text-xs">{description}</p> : null}
      </div>
      {children}
    </section>
  )
}
