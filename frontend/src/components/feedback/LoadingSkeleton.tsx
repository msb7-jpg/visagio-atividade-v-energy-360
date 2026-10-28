import { cn } from '@/lib/utils'

interface LoadingSkeletonProps {
  className?: string
  count?: number
}

/**
 * Esqueleto com shimmer (sem animação quando o usuário prefere movimento reduzido), conforme o design.md.
 * Utilizado para estados de carregamento estruturados sem spinners circulares intrusivos.
 *
 * @param props - Propriedades de customização e contagem de skeletons.
 * @returns Elemento LoadingSkeleton renderizado.
 */
export function LoadingSkeleton({ className, count = 1 }: LoadingSkeletonProps) {
  const items = Array.from({ length: count }, (_, skeletonIndex) => `skeleton-item-${skeletonIndex + 1}`)

  return (
    <div className="flex flex-col gap-2.5">
      {items.map((skeletonKey) => (
        <div
          key={skeletonKey}
          className={cn(
            'h-4 w-full animate-shimmer rounded-md motion-reduce:animate-none motion-reduce:bg-muted',
            className
          )}
        />
      ))}
    </div>
  )
}
