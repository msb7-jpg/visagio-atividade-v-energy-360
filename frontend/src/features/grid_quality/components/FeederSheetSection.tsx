import type { ReactNode } from 'react'

/**
 * Seção do painel do alimentador: rótulo curto em caixa alta pequena e o conteúdo logo abaixo.
 *
 * @param props - Rótulo e conteúdo da seção.
 * @returns Bloco com espaçamento vertical, separado dos vizinhos pela linha do contêiner.
 */
export function FeederSheetSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 py-5 first:pt-0">
      <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">{title}</h3>
      {children}
    </section>
  )
}
