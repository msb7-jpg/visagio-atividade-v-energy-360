import type { ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

/** Tela que detalha cada área do Painel; áreas sem tela própria não têm atalho. */
const GROUP_DESTINATIONS: Record<string, { path: string; label: string }> = {
  comercial: { path: '/revenue', label: 'Inteligência Comercial' },
  rede: { path: '/quality', label: 'Qualidade da Rede' },
  perdas: { path: '/losses', label: 'Fila de Inspeção' }
}

/**
 * Título de uma área do Painel, com o atalho para a tela que a detalha quando ela existe.
 *
 * @param props - Identificador, nome da área e, opcionalmente, um complemento ao lado do título.
 * @returns Linha com o título em caixa alta, o complemento e o link à direita.
 */
export function GroupHeading({ id, title, aside }: { id: string; title: string; aside?: ReactNode }) {
  const destination = GROUP_DESTINATIONS[id]
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <h2 id={`grupo-${id}`} className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          {title}
        </h2>
        {aside}
      </div>
      {destination ? (
        <Link
          to={destination.path}
          className="text-primary inline-flex items-center gap-1 text-xs font-medium underline-offset-4 hover:underline"
        >
          {destination.label}
          <ArrowRight aria-hidden="true" className="size-3" />
        </Link>
      ) : null}
    </div>
  )
}
