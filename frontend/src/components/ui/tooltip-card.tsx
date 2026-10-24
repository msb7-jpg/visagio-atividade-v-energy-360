'use client'
import { cn } from '@/lib/utils'
import { AnimatePresence, motion } from 'motion/react'
import React, { useRef, useState } from 'react'
import { createPortal } from 'react-dom'

interface Position {
  x: number
  y: number
}

function clampDimension(cursor: number, size: number, maxViewport: number, padding = 12): number {
  const nextPos = cursor + padding
  if (nextPos + size > maxViewport - padding) {
    return Math.max(padding, cursor - size - padding)
  }
  return Math.max(padding, nextPos)
}

function computeClampedTooltipPosition(
  viewportX: number,
  viewportY: number,
  tooltipWidth: number,
  tooltipHeight: number
): Position {
  if (typeof window === 'undefined') {
    return { x: viewportX + 12, y: viewportY + 12 }
  }
  return {
    x: clampDimension(viewportX, tooltipWidth, window.innerWidth),
    y: clampDimension(viewportY, tooltipHeight, window.innerHeight)
  }
}

function getElementDimensions(element: HTMLDivElement | null): { width: number; height: number } {
  if (element) {
    return {
      width: Math.max(element.offsetWidth, 340),
      height: Math.max(element.offsetHeight, 60)
    }
  }
  return { width: 340, height: 60 }
}

/**
 * Propriedades para renderização do Tooltip flutuante com clamping de tela.
 */
export interface TooltipProps {
  content: React.ReactNode
  children: React.ReactNode
  containerClassName?: string
  tooltipClassName?: string
}

/**
 * Componente Tooltip flutuante adaptado do Aceternity UI com animação spring.
 *
 * @param props - Propriedades do componente Tooltip.
 * @returns Elemento JSX renderizado.
 */
export function Tooltip({
  content,
  children,
  containerClassName,
  tooltipClassName
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 })
  const contentRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const updatePosition = (clientX: number, clientY: number) => {
    const dimensions = getElementDimensions(contentRef.current)
    setPosition(computeClampedTooltipPosition(clientX, clientY, dimensions.width, dimensions.height))
  }

  const handleMouseEnter = (event: React.MouseEvent<HTMLDivElement>) => {
    updatePosition(event.clientX, event.clientY)
    setIsVisible(true)
  }

  const handleMouseLeave = () => {
    setIsVisible(false)
  }

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isVisible) {
      updatePosition(event.clientX, event.clientY)
    }
  }

  const handleFocus = () => {
    const bounds = containerRef.current?.getBoundingClientRect()
    if (bounds) updatePosition(bounds.left, bounds.bottom)
    setIsVisible(true)
  }

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0]
    updatePosition(touch.clientX, touch.clientY)
    setIsVisible(true)
  }

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const isTouch = typeof window !== 'undefined' && window.matchMedia?.('(hover: none)').matches
    if (!isTouch) return

    event.preventDefault()
    if (isVisible) {
      handleMouseLeave()
    } else {
      handleMouseEnter(event)
    }
  }

  return (
    <div
      ref={containerRef}
      className={cn('relative inline-block', containerClassName)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      onFocus={handleFocus}
      onBlur={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onClick={handleClick}
    >
      {children}
      {typeof document !== 'undefined'
        ? createPortal(
          <AnimatePresence>
            {isVisible ? (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                className={cn(
                  'pointer-events-none fixed z-50 w-auto max-w-sm overflow-hidden rounded-xl border border-border bg-card/95 p-3 shadow-xl backdrop-blur-md',
                  tooltipClassName
                )}
                style={{ top: `${position.y}px`, left: `${position.x}px` }}
              >
                <div ref={contentRef} className="text-foreground">
                  {content}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>,
          document.body
        )
        : null}
    </div>
  )
}
