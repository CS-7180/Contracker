'use client'

import React, { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface GlowCardProps {
  children?: React.ReactNode
  className?: string
  glowColor?: string
}

export function GlowCard({
  children,
  className,
  glowColor = '#818cf8',
}: GlowCardProps): React.ReactElement {
  const [rotation, setRotation] = useState(0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const animate = () => {
      setRotation((prev) => (prev + 0.8) % 360)
      rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <div
      className={cn('relative overflow-hidden rounded-2xl', className)}
      style={{ padding: '2px' }}
    >
      {/* Rotating conic-gradient border */}
      <div
        className="absolute inset-0 rounded-2xl"
        style={{
          background: `conic-gradient(from ${rotation}deg, transparent 0deg, ${glowColor} 90deg, transparent 180deg, ${glowColor}60 270deg, transparent 360deg)`,
        }}
      />
      {/* Outer glow blur layer */}
      <div
        className="absolute inset-0 rounded-2xl opacity-40"
        style={{
          background: `conic-gradient(from ${rotation}deg, transparent 0deg, ${glowColor} 90deg, transparent 180deg, ${glowColor}60 270deg, transparent 360deg)`,
          filter: 'blur(8px)',
        }}
      />
      {/* Card content */}
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          backgroundColor: 'rgba(13, 13, 16, 0.85)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
        }}
      >
        {children}
      </div>
    </div>
  )
}
