'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { FileText, AlertTriangle, Building2, DollarSign, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

const statCards = [
  {
    label: 'Total Contracts',
    icon: FileText,
    gradient: 'from-indigo-500 to-blue-600',
    glowColor: 'shadow-indigo-500/20',
  },
  {
    label: 'Expiring Soon',
    icon: AlertTriangle,
    gradient: 'from-amber-500 to-orange-600',
    glowColor: 'shadow-amber-500/20',
  },
  {
    label: 'Active Suppliers',
    icon: Building2,
    gradient: 'from-emerald-500 to-teal-600',
    glowColor: 'shadow-emerald-500/20',
  },
  {
    label: 'Portfolio Value',
    icon: DollarSign,
    gradient: 'from-violet-500 to-purple-600',
    glowColor: 'shadow-violet-500/20',
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

export default function DashboardPage() {
  const shouldReduceMotion = useReducedMotion()

  const itemVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: 'easeOut' },
    },
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-display font-bold tracking-tight text-foreground text-glow">
          Dashboard
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your contract portfolio at a glance
        </p>
      </div>

      {/* Stat cards grid — shimmer placeholders */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {statCards.map(({ label, icon: Icon, gradient, glowColor }) => (
          <motion.div
            key={label}
            variants={itemVariants}
            whileHover={shouldReduceMotion ? {} : { y: -2, scale: 1.01 }}
            className={`group rounded-xl p-5 glass transition-shadow duration-200 hover:shadow-lg hover:${glowColor}`}
          >
            <div className="flex items-center justify-between">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${gradient} shadow-lg`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div className="h-2 w-2 rounded-full bg-muted-foreground/20" />
            </div>

            <p className="mt-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {label}
            </p>

            {/* Shimmer loading placeholder for value */}
            <div className="mt-2 h-7 w-24 rounded-md bg-white/[0.06] animate-shimmer" />

            {/* Shimmer loading placeholder for subtitle */}
            <div className="mt-2 h-3 w-16 rounded bg-white/[0.04] animate-shimmer" />
          </motion.div>
        ))}
      </motion.div>

      {/* Coming soon section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        className="rounded-xl border border-dashed border-white/[0.1] p-10 text-center glass"
      >
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 ring-1 ring-white/[0.08]">
          <Sparkles className="h-7 w-7 text-indigo-400" />
        </div>
        <h3 className="text-lg font-display font-semibold text-foreground">
          Contract intelligence coming in Sprint 2
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Traffic-light risk indicators, portfolio analysis, and expiring-soon alerts will appear here once the dashboard API is connected.
        </p>
        <Button className="mt-6 bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/20 hover:from-indigo-400 hover:to-violet-500 border-0">
          Get Started
        </Button>
      </motion.div>
    </div>
  )
}
