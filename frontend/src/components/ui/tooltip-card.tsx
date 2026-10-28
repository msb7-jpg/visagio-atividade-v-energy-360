'use client'
import { cn } from '@/lib/utils'
import { AnimatePresence, motion } from 'motion/react'
import React, { useEffect, useRef, useState } from 'react'
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

/** Telas de toque não têm hover: lá o tooltip abre e fecha com o toque. */
function isTouchOnlyDevice(): boolean {
  return typeof window !== 'undefined' && Boolean(window.matchMedia?.('(hover: none)').matches)
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
 * Abre com o mouse (hover), com o foco do teclado (Tab em um filho focável) e com o toque, em telas sem hover.
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

  const show = (clientX: number, clientY: number) => {
    updatePosition(clientX, clientY)
    setIsVisible(true)
  }

  const handleMouseEnter = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isTouchOnlyDevice()) show(event.clientX, event.clientY)
  }

  const handleMouseLeave = () => {
    if (!isTouchOnlyDevice()) setIsVisible(false)
  }

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isVisible && !isTouchOnlyDevice()) updatePosition(event.clientX, event.clientY)
  }

  // Em telas de toque o foco vem junto com o toque, que já abre (e fecha) o tooltip pelo clique.
  const handleFocus = () => {
    if (isTouchOnlyDevice()) return
    const bounds = containerRef.current?.getBoundingClientRect()
    if (bounds) show(bounds.left, bounds.bottom)
  }

  const handleBlur = () => setIsVisible(false)

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isTouchOnlyDevice()) return

    event.preventDefault()
    if (isVisible) {
      setIsVisible(false)
    } else {
      show(event.clientX, event.clientY)
    }
  }

  // Um toque fora do tooltip aberto o fecha (no toque não há "mouse leave").
  useEffect(() => {
    if (!isVisible) return undefined
    const closeOnOutsidePress = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsVisible(false)
    }
    document.addEventListener('pointerdown', closeOnOutsidePress)
    return () => document.removeEventListener('pointerdown', closeOnOutsidePress)
  }, [isVisible])

  return (
    <div
      ref={containerRef}
      className={cn('relative inline-block', containerClassName)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      onFocus={handleFocus}
      onBlur={handleBlur}
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
                  'pointer-events-none fixed z-50 w-auto max-w-sm overflow-hidden rounded-lg border border-border bg-card/95 p-3 shadow-xl backdrop-blur-md',
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
