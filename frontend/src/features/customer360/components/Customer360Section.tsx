import type { ReactNode } from 'react'

interface Customer360SectionProps {
  id: string
  title: string
  description: string
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
    <section aria-labelledby={id} className="flex min-w-0 flex-col gap-4">
      <div className="border-border flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b pb-2.5">
        <h2 id={id} className="text-foreground flex items-center gap-2 text-lg font-semibold">
          <span aria-hidden="true" className="text-muted-foreground">{icon}</span>
          {title}
        </h2>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
      {children}
    </section>
  )
}
