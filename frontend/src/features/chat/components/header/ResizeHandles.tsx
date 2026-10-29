import type { MouseEvent as ReactMouseEvent } from 'react'

type ResizeDirection =
  | 'top'
  | 'right'
  | 'bottom'
  | 'left'
  | 'top-right'
  | 'top-left'
  | 'bottom-right'
  | 'bottom-left'

interface ResizeHandlesProps {
  onResizeStart: (event: ReactMouseEvent, direction: ResizeDirection) => void
}

/**
 * Alças táteis internas para redimensionar a janela flutuante em todas as direções.
 */
export function ResizeHandles({ onResizeStart }: ResizeHandlesProps) {
  return (
    <div className="pointer-events-none absolute inset-0 z-30">
      <div
        onMouseDown={event => onResizeStart(event, 'top')}
        className="pointer-events-auto absolute inset-x-3 top-0 h-2 cursor-ns-resize"
      />
      <div
        onMouseDown={event => onResizeStart(event, 'left')}
        className="pointer-events-auto absolute inset-y-3 left-0 w-2 cursor-ew-resize"
      />
      <div
        onMouseDown={event => onResizeStart(event, 'right')}
        className="pointer-events-auto absolute inset-y-3 right-0 w-2 cursor-ew-resize"
      />
      <div
        onMouseDown={event => onResizeStart(event, 'bottom')}
        className="pointer-events-auto absolute inset-x-3 bottom-0 h-2 cursor-ns-resize"
      />
      <div
        onMouseDown={event => onResizeStart(event, 'top-left')}
        className="pointer-events-auto absolute top-0 left-0 size-4 cursor-nwse-resize"
      />
      <div
        onMouseDown={event => onResizeStart(event, 'top-right')}
        className="pointer-events-auto absolute top-0 right-0 size-4 cursor-nesw-resize"
      />
      <div
        onMouseDown={event => onResizeStart(event, 'bottom-left')}
        className="pointer-events-auto absolute bottom-0 left-0 size-4 cursor-nesw-resize"
      />
      <div
        onMouseDown={event => onResizeStart(event, 'bottom-right')}
        className="pointer-events-auto absolute right-0 bottom-0 size-4 cursor-nwse-resize"
      />
    </div>
  )
}
