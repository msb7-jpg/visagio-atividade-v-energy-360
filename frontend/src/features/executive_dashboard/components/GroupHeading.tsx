import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

/** Tela que detalha cada área do Painel; áreas sem tela própria não têm atalho. */
const GROUP_DESTINATIONS: Record<string, { path: string; label: string }> = {
  comercial: { path: '/revenue', label: 'Ver na Inteligência Comercial' },
  rede: { path: '/quality', label: 'Ver na Qualidade da Rede' },
  perdas: { path: '/losses', label: 'Ver na Fila de Inspeção' }
}

/**
 * Título de uma área do Painel, com o atalho para a tela que a detalha quando ela existe.
 *
 * @param props - Identificador e nome da área.
 * @returns Linha com o título em caixa alta e o link à direita.
 */
export function GroupHeading({ id, title }: { id: string; title: string }) {
  const destination = GROUP_DESTINATIONS[id]
  return (
    <div className="flex items-baseline justify-between gap-2">
      <h2 id={`grupo-${id}`} className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
        {title}
      </h2>
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
