import type { ReactNode } from 'react'

interface Customer360SectionProps {
  id: string
  /** Posição do bloco na ficha ("1", "2"...), repetida na navegação do topo. */
  step: string
  title: string
  /** Uma linha com a resposta do bloco, ao lado do título. */
  description?: string
  icon: ReactNode
  children: ReactNode
}

/**
 * Bloco da Visão 360 como painel próprio: número, ícone e título bem marcados, para cada parte da ficha
 * ser reconhecida de longe. O `id` da seção é o destino da navegação do topo.
 *
 * @param props - Identificador, posição, textos, ícone e conteúdo do bloco.
 * @returns Seção com título acessível e âncora.
 */
export function Customer360Section({ id, step, title, description, icon, children }: Customer360SectionProps) {
  return (
    <section
      id={`${id}-secao`}
      aria-labelledby={id}
      className="bg-card border-border flex min-w-0 scroll-mt-28 flex-col gap-4 rounded-md border p-5"
    >
      <div className="border-border flex flex-wrap items-center gap-x-3 gap-y-1 border-b pb-3">
        <span className="bg-brand text-brand-foreground flex size-6 items-center justify-center rounded-sm text-xs font-semibold" aria-hidden="true">
          {step}
        </span>
        <h2 id={id} className="text-foreground flex items-center gap-2 text-base font-semibold">
          <span aria-hidden="true" className="text-muted-foreground">{icon}</span>
          {title}
        </h2>
        {description ? <p className="text-muted-foreground text-sm">{description}</p> : null}
      </div>
      {children}
    </section>
  )
}
