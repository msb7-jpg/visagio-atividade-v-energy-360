import { Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BrandMarkProps {
  /** Mostra o nome do produto ao lado do símbolo. */
  withName?: boolean
  className?: string
}

/**
 * Marca do V-Energy Grid 360: símbolo na cor da marca (amarelo) com o raio em tinta e o nome do produto.
 *
 * @param props - Exibição do nome e classes de layout.
 * @returns Símbolo da marca, com ou sem o nome.
 */
export function BrandMark({ withName = true, className }: BrandMarkProps) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <span aria-hidden="true" className="bg-brand text-brand-foreground flex size-7 items-center justify-center rounded-md">
        <Zap className="size-4 fill-current" />
      </span>
      {withName ? (
        <span className="flex flex-col leading-none">
          <span className="sr-only">V-Energy Grid 360</span>
          <span aria-hidden="true" className="text-foreground text-sm font-semibold">V-Energy</span>
          <span aria-hidden="true" className="text-muted-foreground text-xs">Grid 360</span>
        </span>
      ) : null}
    </span>
  )
}
