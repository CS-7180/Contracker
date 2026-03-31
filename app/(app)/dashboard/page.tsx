'use client'

import { useState, useEffect } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { FileText, AlertTriangle, XCircle, DollarSign, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { AnimatedCounter } from '@/components/ui/AnimatedCounter'
import { RiskIndicator } from '@/components/ui/RiskIndicator'
import { cn } from '@/lib/utils'

type RiskColour = 'green' | 'amber' | 'red'

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
    risk_colour: RiskColour
  }>
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
}

const CARD_GLOW: Record<string, string> = {
  Active:          '0 0 24px rgba(99,102,241,0.25)',
  Expiring:        '0 0 24px rgba(245,158,11,0.25)',
  Expired:         '0 0 24px rgba(239,68,68,0.25)',
  'Portfolio Value': '0 0 24px rgba(139,92,246,0.25)',
}

function RiskDistributionBar({ active, expiring, expired }: { active: number; expiring: number; expired: number }) {
  const total = active + expiring + expired
  if (total === 0) return null

  const segments = [
    { label: 'Active', count: active, pct: (active / total) * 100, color: 'bg-emerald-500' },
    { label: 'Expiring', count: expiring, pct: (expiring / total) * 100, color: 'bg-amber-500' },
    { label: 'Expired', count: expired, pct: (expired / total) * 100, color: 'bg-red-500' },
  ]

  return (
    <div className="rounded-xl glass p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Portfolio Risk Distribution
        </p>
        <p className="text-xs text-muted-foreground">{total} contracts</p>
      </div>
      <div className="flex h-3 overflow-hidden rounded-full gap-0.5">
        {segments.map(({ label, pct, color, count }) =>
          count > 0 ? (
            <motion.div
              key={label}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, delay: 0.6, ease: 'easeOut' }}
              className={cn('h-full rounded-full', color)}
              title={`${label}: ${count} (${pct.toFixed(0)}%)`}
            />
          ) : null,
        )}
      </div>
      <div className="mt-2 flex gap-4">
        {segments.map(({ label, count, pct, color }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className={cn('h-2 w-2 rounded-full', color)} />
            <span className="text-[11px] text-muted-foreground">
              {label} <span className="font-medium text-foreground">{count}</span>
              <span className="ml-1 text-muted-foreground/60">({pct.toFixed(0)}%)</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Sparkline SVG — simple upward 3-point line
function Sparkline({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 64 12" className="h-3 w-16" fill="none" aria-hidden="true">
      <polyline
        points="0,10 32,5 64,2"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.3"
      />
    </svg>
  )
}

function daysUntil(dateStr: string): number {
  const diff = new Date(dateStr).getTime() - new Date().setHours(0, 0, 0, 0)
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
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
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  }

  const statCards = [
    {
      label: 'Active',
      value: data?.active_count ?? 0,
      isLoading: loading,
      icon: FileText,
      gradient: 'from-indigo-500 to-blue-600',
      sparkColor: '#818cf8',
      testId: 'stat-active',
    },
    {
      label: 'Expiring',
      value: data?.expiring_count ?? 0,
      isLoading: loading,
      icon: AlertTriangle,
      gradient: 'from-amber-500 to-orange-600',
      sparkColor: '#f59e0b',
      testId: 'stat-expiring',
    },
    {
      label: 'Expired',
      value: data?.expired_count ?? 0,
      isLoading: loading,
      icon: XCircle,
      gradient: 'from-red-500 to-rose-600',
      sparkColor: '#ef4444',
      testId: 'stat-expired',
    },
    {
      label: 'Portfolio Value',
      value: data?.total_value ?? 0,
      isLoading: loading,
      icon: DollarSign,
      gradient: 'from-violet-500 to-purple-600',
      sparkColor: '#a78bfa',
      isValue: true,
      testId: 'stat-portfolio-value',
    },
  ]

  return (
    <div className="space-y-6">
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
        {statCards.map(({ label, value, isLoading, icon: Icon, gradient, sparkColor, isValue, testId }) => (
          <motion.div
            key={label}
            variants={itemVariants}
            whileHover={shouldReduceMotion ? {} : { y: -2, scale: 1.01 }}
            className="group rounded-xl glass transition-all duration-200 hover:border-white/[0.14] scan-line-overlay"
            style={{ '--hover-glow': CARD_GLOW[label] } as React.CSSProperties}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLDivElement).style.boxShadow = CARD_GLOW[label] ?? ''
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLDivElement).style.boxShadow = ''
            }}
          >
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${gradient} shadow-lg`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div className="h-2 w-2 rounded-full bg-muted-foreground/20" />
              </div>

              <p className="mt-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {label}
              </p>

              {isLoading ? (
                <div className="mt-2 h-7 w-24 rounded-md bg-white/[0.06] animate-shimmer" />
              ) : (
                <p
                  className="mt-2 text-2xl font-display font-bold tracking-tight text-foreground"
                  data-testid={testId}
                >
                  {isValue ? (
                    <AnimatedCounter value={value} prefix="$" />
                  ) : (
                    <AnimatedCounter value={value} />
                  )}
                </p>
              )}

              <div className="mt-2">
                <Sparkline color={sparkColor} />
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Risk distribution bar */}
      {!loading && data && (
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          <RiskDistributionBar
            active={data.active_count}
            expiring={data.expiring_count}
            expired={data.expired_count}
          />
        </motion.div>
      )}

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
          <motion.ul
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="divide-y divide-white/[0.04]"
          >
            {data.expiring_soon.map((contract) => {
              const days = daysUntil(contract.renewal_date)
              return (
                <motion.li
                  key={contract.id}
                  variants={itemVariants}
                  className="group flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <RiskIndicator colour={contract.risk_colour} size="md" />
                    <Link
                      href={`/contracts/${contract.id}`}
                      className="text-sm font-medium text-foreground hover:text-indigo-400 transition-colors"
                    >
                      {contract.name}
                    </Link>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Days remaining chip */}
                    <span
                      className={cn(
                        'chip text-[11px] font-medium',
                        contract.risk_colour === 'red'
                          ? 'border-red-500/30 bg-red-500/10 text-red-400'
                          : contract.risk_colour === 'amber'
                            ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                            : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
                      )}
                    >
                      {days}d
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(contract.renewal_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/0 transition-all group-hover:text-muted-foreground/60 group-hover:translate-x-0.5" />
                  </div>
                </motion.li>
              )
            })}
          </motion.ul>
        )}
      </motion.div>
    </div>
  )
}
