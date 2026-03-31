'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { Clock, CheckCircle2, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ComingSoonPageProps {
  icon: LucideIcon
  iconGradient: string
  title: string
  description: string
  sprintLabel: string
  features: string[]
}

const MILESTONES = ['M1 Auth', 'M2 Dashboard', 'M3 Alerts', 'M3 Spend', 'M3 Compliance', 'M3 Team']

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

const itemVariants = {
  hidden:   { opacity: 0, y: 16 },
  visible:  { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

export function ComingSoonPage({
  icon: Icon,
  iconGradient,
  title,
  description,
  sprintLabel,
  features,
}: ComingSoonPageProps): React.ReactElement {
  const shouldReduceMotion = useReducedMotion()

  const MotionDiv = shouldReduceMotion ? 'div' : motion.div

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-6 py-12">
      <MotionDiv
        {...(!shouldReduceMotion && {
          variants: containerVariants,
          initial: 'hidden',
          animate: 'visible',
        })}
        className="flex max-w-md flex-col items-center gap-6 text-center"
      >
        {/* Icon */}
        <MotionDiv
          {...(!shouldReduceMotion && { variants: itemVariants })}
          className={cn(
            'flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg',
            iconGradient,
          )}
        >
          <Icon className="h-10 w-10 text-white" />
        </MotionDiv>

        {/* Title */}
        <MotionDiv {...(!shouldReduceMotion && { variants: itemVariants })} className="space-y-2">
          <h2 className="font-display text-3xl font-bold tracking-tight text-foreground text-glow">
            {title}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
        </MotionDiv>

        {/* Sprint chip */}
        <MotionDiv {...(!shouldReduceMotion && { variants: itemVariants })}>
          <span className="chip chip-active gap-2 text-xs font-medium">
            <Clock className="h-3 w-3" />
            {sprintLabel}
          </span>
        </MotionDiv>

        {/* Feature list */}
        <MotionDiv
          {...(!shouldReduceMotion && { variants: itemVariants })}
          className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] p-5 text-left"
        >
          <p className="mb-3 text-[10px] uppercase tracking-widest text-muted-foreground/60">
            What&apos;s coming
          </p>
          <ul className="space-y-2.5">
            {features.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-indigo-400/60" />
                {feature}
              </li>
            ))}
          </ul>
        </MotionDiv>

        {/* Milestone progress dots */}
        <MotionDiv
          {...(!shouldReduceMotion && { variants: itemVariants })}
          className="flex items-center gap-1.5"
        >
          {MILESTONES.map((m, i) => {
            const isActive = m.includes(sprintLabel.split(' ')[1] ?? '')
            const isPast = i < MILESTONES.findIndex((x) => x.includes(sprintLabel.split(' ')[1] ?? ''))
            return (
              <div key={m} className="flex items-center gap-1.5">
                <div
                  title={m}
                  className={cn(
                    'h-2 w-2 rounded-full transition-all',
                    isPast
                      ? 'bg-indigo-500 opacity-60'
                      : isActive
                        ? 'h-3 w-3 bg-gradient-to-r from-indigo-500 to-violet-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]'
                        : 'bg-white/[0.12]',
                  )}
                />
                {i < MILESTONES.length - 1 && (
                  <div className={cn('h-px w-4', isPast ? 'bg-indigo-500/40' : 'bg-white/[0.08]')} />
                )}
              </div>
            )
          })}
        </MotionDiv>
      </MotionDiv>
    </div>
  )
}
