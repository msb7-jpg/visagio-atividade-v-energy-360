export type ResizeDirection =
  | 'top'
  | 'right'
  | 'bottom'
  | 'left'
  | 'top-right'
  | 'top-left'
  | 'bottom-right'
  | 'bottom-left'
  | null

const BASE_MIN_WIDTH = 380
const BASE_MIN_HEIGHT = 480

interface ResizeCalculationInput {
  direction: ResizeDirection
  initialWidth: number
  initialHeight: number
  initialOffsetX: number
  initialOffsetY: number
  deltaX: number
  deltaY: number
}

interface ResizeCalculationResult {
  width: number
  height: number
  offsetX: number
  offsetY: number
}

function getDimensionsBounds() {
  const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1280
  const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 800
  const minWidth = Math.min(BASE_MIN_WIDTH, Math.max(280, windowWidth - 24))
  const minHeight = Math.min(BASE_MIN_HEIGHT, Math.max(360, windowHeight - 32))
  const maxWidth = Math.max(minWidth, windowWidth - 24)
  const maxHeight = Math.max(minHeight, windowHeight - 32)
  return { minWidth, minHeight, maxWidth, maxHeight }
}

function calculateHorizontal(
  direction: ResizeDirection,
  initialWidth: number,
  initialOffsetX: number,
  deltaX: number
): { width: number; offsetX: number } {
  const { minWidth, maxWidth } = getDimensionsBounds()
  if (direction === 'top-right' || direction === 'right' || direction === 'bottom-right') {
    return {
      width: Math.min(maxWidth, Math.max(minWidth, initialWidth + deltaX)),
      offsetX: initialOffsetX
    }
  }
  if (direction === 'top-left' || direction === 'left' || direction === 'bottom-left') {
    const candidateWidth = initialWidth - deltaX
    if (candidateWidth >= minWidth && candidateWidth <= maxWidth) {
      return { width: candidateWidth, offsetX: initialOffsetX + deltaX }
    }
  }
  return { width: initialWidth, offsetX: initialOffsetX }
}

function calculateVertical(
  direction: ResizeDirection,
  initialHeight: number,
  initialOffsetY: number,
  deltaY: number
): { height: number; offsetY: number } {
  const { minHeight, maxHeight } = getDimensionsBounds()
  if (direction === 'top-right' || direction === 'top-left' || direction === 'top') {
    const candidateHeight = initialHeight - deltaY
    if (candidateHeight >= minHeight && candidateHeight <= maxHeight) {
      return { height: candidateHeight, offsetY: initialOffsetY + deltaY }
    }
  }
  if (direction === 'bottom-right' || direction === 'bottom-left' || direction === 'bottom') {
    return {
      height: Math.min(maxHeight, Math.max(minHeight, initialHeight + deltaY)),
      offsetY: initialOffsetY
    }
  }
  return { height: initialHeight, offsetY: initialOffsetY }
}

/**
 * Calcula nova largura, altura e offsets com restrições mínimas responsivas e limites de viewport.
 */
export function calculateResizeDimensions(input: ResizeCalculationInput): ResizeCalculationResult {
  const horiz = calculateHorizontal(input.direction, input.initialWidth, input.initialOffsetX, input.deltaX)
  const vert = calculateVertical(input.direction, input.initialHeight, input.initialOffsetY, input.deltaY)

  return {
    width: horiz.width,
    height: vert.height,
    offsetX: horiz.offsetX,
    offsetY: vert.offsetY
  }
}
