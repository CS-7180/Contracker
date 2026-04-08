'use client'

import { useState, useEffect } from 'react'
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion'
import {
  FileText,
  AlertTriangle,
  XCircle,
  DollarSign,
  ArrowRight,
  Bell,
  CheckCheck,
  Clock,
  TrendingUp,
  ExternalLink,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AnimatedCounter } from '@/components/ui/AnimatedCounter'
import { RiskIndicator } from '@/components/ui/RiskIndicator'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'

type RiskColour = 'green' | 'amber' | 'red'

type DashboardData = {
  active_count: number
  expiring_count: number
  expired_count: number
  green_count: number
  amber_count: number
  red_count: number
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

type NotificationItem = {
  id: string
  contractName: string
  contractId: string
  supplierName: string
  daysRemaining: number
  threshold: 7 | 30 | 60
  isRead: boolean
  createdAt: string
}

// Mock notifications (until real API sends them)
const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: '1',
    contractName: 'Azure Cloud Services Agreement',
    contractId: 'cnt-azure',
    supplierName: 'Microsoft Corp',
    daysRemaining: 6,
    threshold: 7,
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: '2',
    contractName: 'Salesforce CRM Enterprise License',
    contractId: 'cnt-sfdc',
    supplierName: 'Salesforce Inc',
    daysRemaining: 28,
    threshold: 30,
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: '3',
    contractName: 'Office 365 Business Premium',
    contractId: 'cnt-o365',
    supplierName: 'Microsoft Corp',
    daysRemaining: 7,
    threshold: 7,
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 14).toISOString(),
  },
  {
    id: '4',
    contractName: 'AWS Infrastructure Services',
    contractId: 'cnt-aws',
    supplierName: 'Amazon Web Services',
    daysRemaining: 58,
    threshold: 60,
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: '5',
    contractName: 'Slack Business+ Subscription',
    contractId: 'cnt-slack',
    supplierName: 'Salesforce Inc',
    daysRemaining: 29,
    threshold: 30,
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
}

const CARD_GLOW: Record<string, string> = {
  Active:           '0 0 28px rgba(99,102,241,0.3)',
  Expiring:         '0 0 28px rgba(245,158,11,0.3)',
  Expired:          '0 0 28px rgba(239,68,68,0.3)',
  'Portfolio Value': '0 0 28px rgba(139,92,246,0.3)',
}

function getRiskConfig(threshold: 7 | 30 | 60) {
  if (threshold === 7) return {
    border: 'border-l-red-500',
    bg: 'bg-red-500/10',
    badge: 'bg-red-500/15 text-red-400 border-red-500/30',
    progressColor: 'bg-red-500',
    text: 'text-red-400',
    icon: AlertTriangle,
    iconColor: 'text-red-400',
    label: 'Critical',
  }
  if (threshold === 30) return {
    border: 'border-l-amber-500',
    bg: 'bg-amber-500/10',
    badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    progressColor: 'bg-amber-500',
    text: 'text-amber-400',
    icon: Clock,
    iconColor: 'text-amber-400',
    label: 'Warning',
  }
  return {
    border: 'border-l-emerald-500',
    bg: 'bg-emerald-500/10',
    badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    progressColor: 'bg-emerald-500',
    text: 'text-emerald-400',
    icon: TrendingUp,
    iconColor: 'text-emerald-400',
    label: 'Notice',
  }
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const hours = Math.floor(diff / 3_600_000)
  if (hours < 1) return 'Just now'
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function PortfolioRiskBar({ green, amber, red }: { green: number; amber: number; red: number }) {
  const total = green + amber + red
  if (total === 0) return null
  const tiles = [
    { label: 'Green', count: green, hex: '#16a34a', textColor: 'text-emerald-400', borderColor: 'border-emerald-500/30', bg: 'bg-emerald-500/10' },
    { label: 'Amber', count: amber, hex: '#d97706', textColor: 'text-amber-400', borderColor: 'border-amber-500/30', bg: 'bg-amber-500/10' },
    { label: 'Red',   count: red,   hex: '#dc2626', textColor: 'text-red-400',    borderColor: 'border-red-500/30',    bg: 'bg-red-500/10' },
  ]
  return (
    <div className="rounded-xl glass p-4" data-testid="portfolio-risk-bar">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Portfolio Risk</p>
        <p className="text-xs text-muted-foreground">{total} contracts</p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {tiles.map(({ label, count, hex: _hex, textColor, borderColor, bg }) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.5 }}
            className={cn('flex flex-col items-center justify-center rounded-lg border py-3', borderColor, bg)}
          >
            <RiskIndicator colour={label.toLowerCase() as RiskColour} size="sm" />
            <span className={cn('mt-1.5 text-xl font-display font-bold', textColor)}>{count}</span>
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function Sparkline({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 64 12" className="h-3 w-16" fill="none" aria-hidden="true">
      <polyline points="0,10 32,5 64,2" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.3" />
    </svg>
  )
}

function daysUntil(dateStr: string): number {
  const diff = new Date(dateStr).getTime() - new Date().setHours(0, 0, 0, 0)
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

// ── Alerts Feed Panel (right column) ──────────────────────────────────────
function AlertsFeedPanel() {
  const shouldReduceMotion = useReducedMotion()
  const { toast } = useToast()
  const [notifications, setNotifications] = useState<NotificationItem[]>(MOCK_NOTIFICATIONS)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const unreadCount = notifications.filter((n) => !n.isRead).length

  function markAsRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
    toast({ title: 'Marked as read', duration: 2000 })
  }

  function markAllAsRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    toast({ title: 'All alerts marked as read' })
  }

  const sorted = [...notifications].sort((a, b) => {
    if (a.isRead !== b.isRead) return a.isRead ? 1 : -1
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  const itemVariants = {
    hidden: { opacity: 0, x: shouldReduceMotion ? 0 : 16 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  }

  return (
    <div className="flex h-full flex-col rounded-xl glass overflow-hidden">
      {/* Panel header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-indigo-400" />
          <span className="text-sm font-semibold text-foreground">Alerts</span>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white"
            >
              {unreadCount}
            </motion.span>
          )}
        </div>
        {unreadCount > 0 && (
          <motion.button
            onClick={markAllAsRead}
            whileTap={shouldReduceMotion ? {} : { scale: 0.93 }}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </motion.button>
        )}
      </div>

      {/* Scrollable feed */}
      <div className="relative flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(99,102,241,0.3) transparent' }}>
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-16 text-center px-4">
            {shouldReduceMotion ? (
              <Bell className="h-10 w-10 text-muted-foreground/20 mb-3" />
            ) : (
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                className="mb-3"
              >
                <Bell className="h-10 w-10 text-muted-foreground/20" />
              </motion.div>
            )}
            <p className="text-sm font-medium text-foreground">No active alerts</p>
            <p className="mt-1 text-xs text-muted-foreground">All contracts are healthy</p>
          </div>
        ) : (
          <motion.ul
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="divide-y divide-white/[0.04] px-2 py-2 space-y-1"
          >
            <AnimatePresence mode="popLayout">
              {sorted.map((n) => {
                const config = getRiskConfig(n.threshold)
                const progress = Math.min(100, ((n.threshold - n.daysRemaining) / n.threshold) * 100)
                const isHovered = hoveredId === n.id

                return (
                  <motion.li
                    key={n.id}
                    variants={itemVariants}
                    layout
                    exit={{ opacity: 0, x: -16 }}
                    onMouseEnter={() => setHoveredId(n.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    className={cn(
                      'group relative overflow-hidden rounded-lg p-3 transition-all duration-200',
                      'border border-transparent hover:border-white/[0.08] hover:bg-white/[0.04]',
                      !n.isRead && 'border-l-2',
                      !n.isRead && config.border,
                      n.isRead && 'opacity-55'
                    )}
                  >
                    {/* Unread glow bg */}
                    {!n.isRead && (
                      <div className={cn('absolute inset-0 opacity-[0.06] rounded-lg', config.bg)} />
                    )}

                    <div className="relative flex items-start gap-2.5">
                      {/* Risk icon */}
                      <div className={cn('mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full', config.bg)}>
                        <config.icon className={cn('h-3.5 w-3.5', config.iconColor)} />
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            href={`/contracts/${n.contractId}`}
                            className="flex items-center gap-1 text-xs font-semibold text-foreground hover:text-indigo-400 transition-colors min-w-0 leading-snug"
                          >
                            <span className="truncate">{n.contractName}</span>
                            <ExternalLink className="h-2.5 w-2.5 flex-shrink-0 opacity-0 group-hover:opacity-60 transition-opacity" />
                          </Link>
                          {/* Unread dot */}
                          {!n.isRead && (
                            <div className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-indigo-400 mt-1" />
                          )}
                        </div>

                        <p className="mt-0.5 text-[10px] text-muted-foreground truncate">{n.supplierName}</p>

                        <div className="mt-1.5 flex items-center gap-2">
                          <span className={cn('text-[11px] font-semibold', config.text)}>
                            {n.daysRemaining}d left
                          </span>
                          <span className={cn('rounded-full border px-1.5 py-0.5 text-[9px] font-medium', config.badge)}>
                            {config.label}
                          </span>
                          <span className="ml-auto text-[10px] text-muted-foreground/60">{formatRelativeTime(n.createdAt)}</span>
                        </div>

                        {/* Urgency progress bar */}
                        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className={cn('h-full rounded-full', config.progressColor)}
                          />
                        </div>

                        {/* Mark as read (hover reveal) */}
                        <AnimatePresence>
                          {!n.isRead && isHovered && (
                            <motion.button
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              onClick={() => markAsRead(n.id)}
                              className="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                            >
                              <CheckCheck className="h-3 w-3" />
                              Mark as read
                            </motion.button>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </motion.li>
                )
              })}
            </AnimatePresence>
          </motion.ul>
        )}

        {/* Bottom fade */}
        <div
          className="pointer-events-none sticky bottom-0 h-8 w-full"
          style={{ background: 'linear-gradient(to top, rgba(12,12,15,0.8), transparent)' }}
        />
      </div>

      {/* Footer link */}
      <div className="border-t border-white/[0.06] px-4 py-2.5 flex-shrink-0">
        <Link
          href="/notifications"
          className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground hover:text-indigo-400 transition-colors"
        >
          View all alerts
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  )
}

// ── Main Dashboard Page ────────────────────────────────────────────────────
export default function DashboardPage() {
  const shouldReduceMotion = useReducedMotion()
  const router = useRouter()
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
      icon: FileText,
      gradient: 'from-indigo-500 to-blue-600',
      sparkColor: '#818cf8',
      href: '/contracts?status=active',
      testId: 'stat-active',
    },
    {
      label: 'Expiring',
      value: data?.expiring_count ?? 0,
      icon: AlertTriangle,
      gradient: 'from-amber-500 to-orange-600',
      sparkColor: '#f59e0b',
      href: '/contracts?status=expiring',
      testId: 'stat-expiring',
    },
    {
      label: 'Expired',
      value: data?.expired_count ?? 0,
      icon: XCircle,
      gradient: 'from-red-500 to-rose-600',
      sparkColor: '#ef4444',
      href: '/contracts?status=expired',
      testId: 'stat-expired',
    },
    {
      label: 'Portfolio Value',
      value: data?.total_value ?? 0,
      icon: DollarSign,
      gradient: 'from-violet-500 to-purple-600',
      sparkColor: '#a78bfa',
      href: '/contracts',
      isValue: true,
      testId: 'stat-portfolio-value',
    },
  ]

  return (
    <div className="flex h-full flex-col gap-6">
      {/* Page header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="text-2xl font-display font-bold tracking-tight text-foreground text-glow">
            Command Center
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Your contract portfolio at a glance
          </p>
        </div>
        <Link
          href="/contracts/new"
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-500/20 transition-all hover:shadow-indigo-500/30 hover:brightness-110"
        >
          <FileText className="h-4 w-4" />
          New Contract
        </Link>
      </div>

      {/* Two-column command center layout */}
      <div className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-[1fr_340px] min-h-0">

        {/* ── LEFT COLUMN ── */}
        <div className="flex flex-col gap-5 min-h-0 overflow-auto">

          {/* Stat cards */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 gap-3 xl:grid-cols-4"
          >
            {statCards.map(({ label, value, icon: Icon, gradient, sparkColor, href, isValue, testId }) => (
              <motion.div key={label} variants={itemVariants}>
                <Link
                  href={href}
                  className="group block rounded-xl glass transition-all duration-200 hover:border-white/[0.14] scan-line-overlay"
                  onMouseEnter={(e) => {
                    ;(e.currentTarget as HTMLElement).style.boxShadow = CARD_GLOW[label] ?? ''
                  }}
                  onMouseLeave={(e) => {
                    ;(e.currentTarget as HTMLElement).style.boxShadow = ''
                  }}
                  title={`View ${label.toLowerCase()} contracts`}
                >
                  <motion.div
                    whileHover={shouldReduceMotion ? {} : { y: -2, scale: 1.01 }}
                    className="p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${gradient} shadow-lg`}>
                        <Icon className="h-4.5 w-4.5 text-white" />
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/0 transition-all group-hover:text-muted-foreground/50" />
                    </div>
                    <p className="mt-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
                    {loading ? (
                      <div className="mt-1.5 h-7 w-16 rounded-md bg-white/[0.06] animate-shimmer" />
                    ) : (
                      <p className="mt-1.5 text-2xl font-display font-bold tracking-tight text-foreground" data-testid={testId}>
                        {isValue ? <AnimatedCounter value={value} prefix="$" /> : <AnimatedCounter value={value} />}
                      </p>
                    )}
                    <div className="mt-2">
                      <Sparkline color={sparkColor} />
                    </div>
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </motion.div>

          {/* Portfolio risk summary bar (traffic-light counts) */}
          {!loading && data && (
            <motion.div
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
            >
              <PortfolioRiskBar
                green={data.green_count}
                amber={data.amber_count}
                red={data.red_count}
              />
            </motion.div>
          )}

          {/* Expiring soon list */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="flex-1 rounded-xl glass overflow-hidden flex flex-col min-h-0"
          >
            <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3.5 flex-shrink-0">
              <h3 className="text-sm font-semibold text-foreground">Renewing within 30 days</h3>
              <Link
                href="/contracts?status=expiring"
                className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-indigo-400 transition-colors"
              >
                View all
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="flex-1 overflow-auto min-h-0">
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
                <div className="flex flex-col items-center justify-center p-10 text-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full glass">
                    <FileText className="h-6 w-6 text-muted-foreground/30" />
                  </div>
                  <p className="text-sm text-muted-foreground">No contracts renewing in the next 30 days</p>
                </div>
              ) : (
                <motion.ul
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="divide-y divide-white/[0.04]"
                >
                  {[...data.expiring_soon]
                    .sort((a, b) => {
                      const order: Record<RiskColour, number> = { red: 0, amber: 1, green: 2 }
                      return order[a.risk_colour] - order[b.risk_colour]
                    })
                    .map((contract) => {
                    const days = daysUntil(contract.renewal_date)
                    return (
                      <motion.li
                        key={contract.id}
                        variants={itemVariants}
                        className="group flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.02] transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <RiskIndicator colour={contract.risk_colour} size="md" />
                          <Link
                            href={`/contracts/${contract.id}`}
                            className="text-sm font-medium text-foreground hover:text-indigo-400 transition-colors truncate"
                          >
                            {contract.name}
                          </Link>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
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
                          <span className="text-xs text-muted-foreground hidden sm:inline">
                            {new Date(contract.renewal_date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/0 transition-all group-hover:text-muted-foreground/60 group-hover:translate-x-0.5" />
                        </div>
                      </motion.li>
                    )
                  })}
                </motion.ul>
              )}
            </div>
          </motion.div>
        </div>

        {/* ── RIGHT COLUMN — Alerts Feed ── */}
        <motion.div
          initial={{ opacity: 0, x: shouldReduceMotion ? 0 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="min-h-0"
        >
          <AlertsFeedPanel />
        </motion.div>
      </div>
    </div>
  )
}
