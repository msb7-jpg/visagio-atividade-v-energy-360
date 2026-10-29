import { useAnimate } from 'motion/react'
import { useCallback } from 'react'
import {
  calculateDragConstraints,
  calculateNearestSnapTarget
} from '@/features/chat/hooks/smartSnapCalculations'

interface UseSmartSnapProps {
  width: number
  height: number
  baseAnchor: 'bottom-right' | 'bottom-left'
  isFullscreen: boolean
}

/**
 * Hook que gerencia limites de tela e atração magnética inteligente (smart snap) com animação suave.
 */
export function useSmartSnap({ width, height, baseAnchor, isFullscreen }: UseSmartSnapProps) {
  const [scope, animate] = useAnimate()

  const dragConstraints = calculateDragConstraints(width, height, baseAnchor)

  const handleDragEnd = useCallback(() => {
    if (isFullscreen || !scope.current) return

    const rect = scope.current.getBoundingClientRect()
    const target = calculateNearestSnapTarget({
      rect,
      width,
      height,
      baseAnchor
    })

    void animate(
      scope.current,
      { x: target.x, y: target.y },
      { type: 'spring', stiffness: 350, damping: 28 }
    )
  }, [isFullscreen, scope, animate, width, height, baseAnchor])

  const resetPosition = useCallback(() => {
    if (!scope.current) return
    void animate(scope.current, { x: 0, y: 0 }, { duration: 0.15 })
  }, [scope, animate])

  return {
    scope,
    dragConstraints,
    handleDragEnd,
    resetPosition
  }
}
