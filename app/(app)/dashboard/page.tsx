'use client'

import { useState, useEffect } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { FileText, AlertTriangle, XCircle, DollarSign } from 'lucide-react'

type DashboardData = {
  active_count: number
  expiring_count: number
  expired_count: number
  total_value: number
  expiring_soon: Array<{
    id: string
    name: string
    renewal_date: string
    end_date: string
    notice_period_days: number
    value: number | null
    risk_colour: 'green' | 'amber' | 'red'
  }>
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

export default function DashboardPage() {
  const shouldReduceMotion = useReducedMotion()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => r.json())
      .then(({ data }) => { if (data) setData(data) })
      .finally(() => setLoading(false))
  }, [])

  const itemVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: 'easeOut' },
    },
  }

  const statCards = [
    {
      label: 'Active',
      value: data?.active_count ?? null,
      icon: FileText,
      gradient: 'from-indigo-500 to-blue-600',
      glowColor: 'shadow-indigo-500/20',
      testId: 'stat-active',
    },
    {
      label: 'Expiring',
      value: data?.expiring_count ?? null,
      icon: AlertTriangle,
      gradient: 'from-amber-500 to-orange-600',
      glowColor: 'shadow-amber-500/20',
      testId: 'stat-expiring',
    },
    {
      label: 'Expired',
      value: data?.expired_count ?? null,
      icon: XCircle,
      gradient: 'from-red-500 to-rose-600',
      glowColor: 'shadow-red-500/20',
      testId: 'stat-expired',
    },
    {
      label: 'Portfolio Value',
      value: data ? `$${data.total_value.toLocaleString()}` : null,
      icon: DollarSign,
      gradient: 'from-violet-500 to-purple-600',
      glowColor: 'shadow-violet-500/20',
      testId: 'stat-portfolio-value',
    },
  ]

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

      {/* Stat cards grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {statCards.map(({ label, value, icon: Icon, gradient, glowColor, testId }) => (
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

            {loading ? (
              <div className="mt-2 h-7 w-24 rounded-md bg-white/[0.06] animate-shimmer" />
            ) : (
              <p
                className="mt-2 text-2xl font-display font-bold tracking-tight text-foreground"
                data-testid={testId}
              >
                {value ?? '—'}
              </p>
            )}

            <div className="mt-2 h-3 w-16 rounded bg-white/[0.04] animate-shimmer" />
          </motion.div>
        ))}
      </motion.div>

      {/* Expiring soon list */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        className="rounded-xl glass"
      >
        <div className="p-5 border-b border-white/[0.06]">
          <h3 className="text-sm font-semibold text-foreground">
            Renewing within 30 days
          </h3>
        </div>

        {loading ? (
          <div className="divide-y divide-white/[0.04]">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-4">
                <div className="h-4 w-48 rounded bg-white/[0.06] animate-shimmer" />
                <div className="h-4 w-20 rounded bg-white/[0.06] animate-shimmer" />
              </div>
            ))}
          </div>
        ) : !data || data.expiring_soon.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm text-muted-foreground">
              No contracts renewing in the next 30 days
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-white/[0.04]">
            {data.expiring_soon.map((contract) => (
              <li key={contract.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <span
                    className={`h-2 w-2 rounded-full flex-shrink-0 ${
                      contract.risk_colour === 'red'
                        ? 'bg-red-500'
                        : contract.risk_colour === 'amber'
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                    }`}
                    aria-label={contract.risk_colour}
                  />
                  <a
                    href={`/contracts/${contract.id}`}
                    className="text-sm font-medium text-foreground hover:text-indigo-400 transition-colors"
                  >
                    {contract.name}
                  </a>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(contract.renewal_date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </motion.div>
    </div>
  )
}
