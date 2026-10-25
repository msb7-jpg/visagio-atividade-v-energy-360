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

const MIN_WIDTH = 340
const MIN_HEIGHT = 440

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

function calculateHorizontal(
  direction: ResizeDirection,
  initialWidth: number,
  initialOffsetX: number,
  deltaX: number
): { width: number; offsetX: number } {
  const maxWidth = Math.max(MIN_WIDTH, window.innerWidth - 32)
  if (direction === 'top-right' || direction === 'right' || direction === 'bottom-right') {
    return {
      width: Math.min(maxWidth, Math.max(MIN_WIDTH, initialWidth + deltaX)),
      offsetX: initialOffsetX
    }
  }
  if (direction === 'top-left' || direction === 'left' || direction === 'bottom-left') {
    const candidateWidth = initialWidth - deltaX
    if (candidateWidth >= MIN_WIDTH && candidateWidth <= maxWidth) {
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
  const maxHeight = Math.max(MIN_HEIGHT, window.innerHeight - 32)
  if (direction === 'top-right' || direction === 'top-left' || direction === 'top') {
    const candidateHeight = initialHeight - deltaY
    if (candidateHeight >= MIN_HEIGHT && candidateHeight <= maxHeight) {
      return { height: candidateHeight, offsetY: initialOffsetY + deltaY }
    }
  }
  if (direction === 'bottom-right' || direction === 'bottom-left' || direction === 'bottom') {
    return {
      height: Math.min(maxHeight, Math.max(MIN_HEIGHT, initialHeight + deltaY)),
      offsetY: initialOffsetY
    }
  }
  return { height: initialHeight, offsetY: initialOffsetY }
}

/**
 * Calcula nova largura, altura e offsets com restrições mínimas e limites de viewport.
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
