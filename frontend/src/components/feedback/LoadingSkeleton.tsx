import { cn } from '@/lib/utils'

interface LoadingSkeletonProps {
  className?: string
  count?: number
}

/**
 * Componente Skeleton com animação Shimmer matching dimensions (design.md).
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
            'bg-muted h-4 w-full animate-pulse rounded-lg',
            className
          )}
        />
      ))}
    </div>
  )
}
