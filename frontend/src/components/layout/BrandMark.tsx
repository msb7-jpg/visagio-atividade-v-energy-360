import logoVenergy from '@/assets/logo-venergy.png'
import { cn } from '@/lib/utils'

interface BrandMarkProps {
  /** Mostra o nome do produto ao lado do símbolo. */
  withName?: boolean
  className?: string
}

/**
 * Marca do V-Energy Grid 360: o logo (raio dentro de um círculo aberto, 360°, sobre o amarelo da marca) e o nome do produto.
 * O PNG tem fundo transparente e 192 px (4× os 48 px exibidos) para ficar nítido em telas de alta densidade.
 *
 * @param props - Exibição do nome e classes de layout.
 * @returns Símbolo da marca, com ou sem o nome.
 */
export function BrandMark({ withName = true, className }: BrandMarkProps) {
  return (
    <span className={cn('flex items-center gap-3', className)}>
      <img src={logoVenergy} alt="" aria-hidden="true" width={48} height={48} className="size-12 shrink-0" />
      {withName ? (
        <span className="flex flex-col gap-0.5 leading-none">
          <span className="sr-only">V-Energy Grid 360</span>
          <span aria-hidden="true" className="text-foreground text-xl font-semibold">V-Energy</span>
          <span aria-hidden="true" className="text-muted-foreground text-sm">Grid 360</span>
        </span>
      ) : null}
    </span>
  )
}
