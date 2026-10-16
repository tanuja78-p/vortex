import React, { useState, useEffect, useRef } from 'react'

interface MouseGlowProps {
  color?: string
  size?: number
  blur?: number
  opacity?: number
  followSpeed?: number
  zIndex?: number
  disabled?: boolean
}

export function MouseGlow({
  color = 'rgba(225, 29, 72, 0.12)',
  size = 500,
  blur = 130,
  opacity = 0.5,
  followSpeed = 0.08,
  zIndex = 0,
  disabled = false,
}: MouseGlowProps) {
  const [pos, setPos] = useState({ x: -1000, y: -1000 })
  const [isVisible, setIsVisible] = useState(false)
  const targetPos = useRef({ x: -1000, y: -1000 })
  const currentPos = useRef({ x: -1000, y: -1000 })
  const animFrame = useRef<number | null>(null)

  useEffect(() => {
    // Check reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (disabled || mediaQuery.matches) {
      setIsVisible(false)
      return
    }

    const handleMouseMove = (e: MouseEvent) => {
      targetPos.current = { x: e.clientX, y: e.clientY }
      if (!isVisible) setIsVisible(true)
    }

    const handleMouseLeave = () => {
      setIsVisible(false)
    }

    const loop = () => {
      currentPos.current.x += (targetPos.current.x - currentPos.current.x) * followSpeed
      currentPos.current.y += (targetPos.current.y - currentPos.current.y) * followSpeed
      setPos({ x: currentPos.current.x, y: currentPos.current.y })
      animFrame.current = requestAnimationFrame(loop)
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    document.documentElement.addEventListener('mouseleave', handleMouseLeave)
    animFrame.current = requestAnimationFrame(loop)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      document.documentElement.removeEventListener('mouseleave', handleMouseLeave)
      if (animFrame.current) cancelAnimationFrame(animFrame.current)
    }
  }, [disabled, followSpeed, isVisible])

  if (!isVisible || disabled) return null

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex,
        transition: 'opacity 0.4s ease',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: `${pos.x - size / 2}px`,
          top: `${pos.y - size / 2}px`,
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          backgroundColor: color,
          filter: `blur(${blur}px)`,
          opacity,
          transform: 'translate3d(0,0,0)',
          willChange: 'transform',
        }}
      />
    </div>
  )
}
