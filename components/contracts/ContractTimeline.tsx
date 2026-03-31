'use client'

import { motion, useReducedMotion } from 'framer-motion'

interface ContractTimelineProps {
  startDate: string   // YYYY-MM-DD
  endDate: string     // YYYY-MM-DD
  renewalDate: string // YYYY-MM-DD
  riskColour: 'green' | 'amber' | 'red'
}

const FILL_COLOUR: Record<'green' | 'amber' | 'red', string> = {
  green: 'bg-emerald-500',
  amber: 'bg-amber-500',
  red:   'bg-red-500',
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function daysBetween(a: Date, b: Date): number {
  return (b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)
}

function formatShort(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const d = new Date(year, month - 1, day)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
}

export function ContractTimeline({
  startDate,
  endDate,
  renewalDate,
  riskColour,
}: ContractTimelineProps) {
  const shouldReduceMotion = useReducedMotion()

  const start = new Date(startDate)
  const end   = new Date(endDate)
  const renewal = new Date(renewalDate)
  const today = new Date()

  const totalDays   = daysBetween(start, end)
  const todayDays   = daysBetween(start, today)
  const renewalDays = daysBetween(start, renewal)

  const todayPct   = totalDays > 0 ? clamp((todayDays   / totalDays) * 100, 0, 100) : 0
  const renewalPct = totalDays > 0 ? clamp((renewalDays / totalDays) * 100, 0, 100) : 0

  const fillColour = FILL_COLOUR[riskColour]

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-5"
    >
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 mb-2">
        Contract Timeline
      </p>

      {/* Progress bar */}
      <div className="bg-white/[0.06] rounded-full h-2 relative">
        {/* Fill: today's progress */}
        <motion.div
          className={`h-full rounded-full ${fillColour}`}
          initial={{ width: 0 }}
          animate={{ width: `${todayPct}%` }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { duration: 0.8, delay: 0.2, ease: 'easeOut' }
          }
        />

        {/* Renewal date marker */}
        <div
          className="absolute top-1/2 -translate-y-1/2 h-4 w-0.5 rounded-full bg-white/40"
          style={{ left: `${renewalPct}%` }}
        />
      </div>

      {/* Date labels */}
      <div className="mt-2 relative h-4 text-[10px] text-muted-foreground/60">
        {/* Start — always left */}
        <span className="absolute left-0">{formatShort(startDate)}</span>

        {/* Renewal — centered at renewalPct */}
        <span
          className="absolute -translate-x-1/2 whitespace-nowrap"
          style={{ left: `${renewalPct}%` }}
        >
          {formatShort(renewalDate)}
        </span>

        {/* End — always right */}
        <span className="absolute right-0">{formatShort(endDate)}</span>
      </div>
    </motion.div>
  )
}
