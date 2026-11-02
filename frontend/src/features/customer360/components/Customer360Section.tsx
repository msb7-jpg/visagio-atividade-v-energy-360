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
      <div className="border-border flex items-start gap-3 border-b pb-3">
        <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">{icon}</div>
        <div className="flex flex-col">
          <h2 id={id} className="text-foreground text-lg font-bold tracking-tight">{title}</h2>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
      </div>
      {children}
    </section>
  )
}
