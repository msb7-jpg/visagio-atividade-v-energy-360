interface SnapPointInput {
  rect: DOMRect
  width: number
  height: number
  baseAnchor: 'bottom-right' | 'bottom-left'
}

interface Point {
  x: number
  y: number
}

const PADDING = 24 // 24px margem do viewport

/**
 * Determina o ponto de destino (x, y) de transformação para o canto mais próximo da tela.
 */
export function calculateNearestSnapTarget({
  rect,
  width,
  height,
  baseAnchor
}: SnapPointInput): Point {
  const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1280
  const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 800

  const centerX = rect.left + rect.width / 2
  const centerY = rect.top + rect.height / 2

  const isLeftHalf = centerX < windowWidth / 2
  const isTopHalf = centerY < windowHeight / 2

  const maxDeltaX = windowWidth - width - 2 * PADDING
  const maxDeltaY = windowHeight - height - 2 * PADDING

  if (baseAnchor === 'bottom-right') {
    return {
      x: isLeftHalf ? -maxDeltaX : 0,
      y: isTopHalf ? -maxDeltaY : 0
    }
  }

  return {
    x: isLeftHalf ? 0 : maxDeltaX,
    y: isTopHalf ? -maxDeltaY : 0
  }
}

/**
 * Limita os valores de deslocamento do arraste (dragConstraints) para manter o chat sempre dentro do viewport.
 */
export function calculateDragConstraints(
  width: number,
  height: number,
  baseAnchor: 'bottom-right' | 'bottom-left'
) {
  const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1280
  const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 800

  const maxDeltaX = Math.max(0, windowWidth - width - 2 * PADDING)
  const maxDeltaY = Math.max(0, windowHeight - height - 2 * PADDING)

  if (baseAnchor === 'bottom-right') {
    return {
      top: -maxDeltaY,
      bottom: 0,
      left: -maxDeltaX,
      right: 0
    }
  }

  return {
    top: -maxDeltaY,
    bottom: 0,
    left: 0,
    right: maxDeltaX
  }
}
