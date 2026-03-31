'use client'

import { useEffect, useRef } from 'react'
import { useMotionValue, useSpring, useTransform, motion, useReducedMotion } from 'framer-motion'

interface AnimatedCounterProps {
  value: number
  prefix?: string
  suffix?: string
  decimals?: number
  duration?: number
  className?: string
}

export function AnimatedCounter({
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  className,
}: AnimatedCounterProps): React.ReactElement {
  const shouldReduceMotion = useReducedMotion()
  const motionValue = useMotionValue(0)
  const spring = useSpring(motionValue, { stiffness: 60, damping: 20 })
  const ref = useRef<HTMLSpanElement>(null)

  const display = useTransform(spring, (v) => {
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(v)
    return `${prefix}${formatted}${suffix}`
  })

  useEffect(() => {
    if (shouldReduceMotion) return
    motionValue.set(value)
  }, [value, motionValue, shouldReduceMotion])

  if (shouldReduceMotion) {
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value)
    return (
      <span ref={ref} className={className} suppressHydrationWarning>
        {prefix}{formatted}{suffix}
      </span>
    )
  }

  return (
    <motion.span
      ref={ref}
      className={className}
      suppressHydrationWarning
    >
      {display}
    </motion.span>
  )
}
