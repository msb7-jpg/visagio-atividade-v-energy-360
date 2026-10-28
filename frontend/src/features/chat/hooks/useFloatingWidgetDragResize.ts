import { useCallback, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react'
import {
  calculateResizeDimensions,
  type ResizeDirection
} from '@/features/chat/hooks/floatingWidgetCalculations'

interface ResizeState {
  isResizing: boolean
  direction: ResizeDirection
  startX: number
  startY: number
  initialWidth: number
  initialHeight: number
  initialOffsetX: number
  initialOffsetY: number
}

const DEFAULT_WIDTH = 448
const DEFAULT_HEIGHT = 672

/**
 * Hook para controle de dimensões de redimensionamento de janela flutuante com clamp.
 *
 * @param isFullscreen - Se o modo tela cheia está ativo para desabilitar resize.
 * @returns Estados e handlers para redimensionamento do widget.
 */
export function useFloatingWidgetDragResize(isFullscreen: boolean) {
  const [size, setSize] = useState({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT })
  const resizeStateRef = useRef<ResizeState>({
    isResizing: false,
    direction: null,
    startX: 0,
    startY: 0,
    initialWidth: DEFAULT_WIDTH,
    initialHeight: DEFAULT_HEIGHT,
    initialOffsetX: 0,
    initialOffsetY: 0
  })

  const onResizeStart = useCallback(
    (event: ReactMouseEvent, direction: ResizeDirection) => {
      if (isFullscreen) return
      event.preventDefault()
      event.stopPropagation()

      resizeStateRef.current = {
        isResizing: true,
        direction,
        startX: event.clientX,
        startY: event.clientY,
        initialWidth: size.width,
        initialHeight: size.height,
        initialOffsetX: 0,
        initialOffsetY: 0
      }

      const onMouseMove = (moveEvent: MouseEvent) => {
        if (!resizeStateRef.current.isResizing) return
        const next = calculateResizeDimensions({
          direction: resizeStateRef.current.direction,
          initialWidth: resizeStateRef.current.initialWidth,
          initialHeight: resizeStateRef.current.initialHeight,
          initialOffsetX: 0,
          initialOffsetY: 0,
          deltaX: moveEvent.clientX - resizeStateRef.current.startX,
          deltaY: moveEvent.clientY - resizeStateRef.current.startY
        })

        setSize({ width: next.width, height: next.height })
      }

      const onMouseUp = () => {
        resizeStateRef.current.isResizing = false
        window.removeEventListener('mousemove', onMouseMove)
        window.removeEventListener('mouseup', onMouseUp)
      }

      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseup', onMouseUp)
    },
    [isFullscreen, size]
  )

  const resetSize = useCallback(() => {
    setSize({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT })
  }, [])

  return {
    size,
    onResizeStart,
    resetSize
  }
}
