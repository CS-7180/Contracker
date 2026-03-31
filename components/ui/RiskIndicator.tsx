'use client'

import { cn } from '@/lib/utils'

type RiskColour = 'green' | 'amber' | 'red'

interface RiskIndicatorProps {
  colour: RiskColour
  size?: 'sm' | 'md' | 'lg'
  pulse?: boolean
  className?: string
}

const SIZE_MAP = {
  sm: 'h-2 w-2',
  md: 'h-2.5 w-2.5',
  lg: 'h-3 w-3',
}

const RING_SIZE_MAP = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
}

const COLOUR_MAP: Record<RiskColour, string> = {
  green: 'bg-emerald-500',
  amber: 'bg-amber-500',
  red:   'bg-red-500',
}

const RING_COLOUR_MAP: Record<RiskColour, string> = {
  green: 'bg-emerald-500',
  amber: 'bg-amber-500',
  red:   'bg-red-500',
}

export function RiskIndicator({
  colour,
  size = 'md',
  pulse,
  className,
}: RiskIndicatorProps): React.ReactElement {
  const shouldPulse = pulse ?? colour === 'red'

  return (
    <span className={cn('relative inline-flex items-center justify-center', className)}>
      {shouldPulse && (
        <span
          className={cn(
            'absolute rounded-full opacity-75 animate-pulse-ring',
            RING_SIZE_MAP[size],
            RING_COLOUR_MAP[colour],
          )}
        />
      )}
      <span
        className={cn(
          'relative rounded-full flex-shrink-0',
          SIZE_MAP[size],
          COLOUR_MAP[colour],
        )}
      />
    </span>
  )
}
