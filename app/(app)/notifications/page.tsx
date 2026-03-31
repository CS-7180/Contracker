'use client'

import { useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Bell, FileText, CheckCheck, AlertTriangle, Clock, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'

type NotificationThreshold = 7 | 30 | 60

interface Notification {
  id: string
  contractName: string
  supplierName: string
  daysRemaining: number
  threshold: NotificationThreshold
  isRead: boolean
  createdAt: string
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    contractName: 'Azure Cloud Services Agreement',
    supplierName: 'Microsoft Corp',
    daysRemaining: 6,
    threshold: 7,
    isRead: false,
    createdAt: '2026-03-29T09:15:00Z',
  },
  {
    id: '2',
    contractName: 'Salesforce CRM Enterprise License',
    supplierName: 'Salesforce Inc',
    daysRemaining: 28,
    threshold: 30,
    isRead: false,
    createdAt: '2026-03-29T08:00:00Z',
  },
  {
    id: '3',
    contractName: 'Office 365 Business Premium',
    supplierName: 'Microsoft Corp',
    daysRemaining: 7,
    threshold: 7,
    isRead: false,
    createdAt: '2026-03-28T14:30:00Z',
  },
  {
    id: '4',
    contractName: 'AWS Infrastructure Services',
    supplierName: 'Amazon Web Services',
    daysRemaining: 58,
    threshold: 60,
    isRead: true,
    createdAt: '2026-03-27T11:00:00Z',
  },
  {
    id: '5',
    contractName: 'Slack Business+ Subscription',
    supplierName: 'Salesforce Inc',
    daysRemaining: 29,
    threshold: 30,
    isRead: true,
    createdAt: '2026-03-26T16:45:00Z',
  },
]

type FilterTab = 'all' | 'unread' | 'read'

function getThresholdConfig(threshold: NotificationThreshold) {
  if (threshold === 7) {
    return {
      ring: 'ring-2 ring-red-500/40',
      bg: 'bg-red-500/10',
      glow: 'glow-red',
      icon: AlertTriangle,
      iconColor: 'text-red-400',
      badge: 'bg-red-500/15 text-red-400 border-red-500/30',
      label: 'Critical',
      pulseRing: true,
    }
  }
  if (threshold === 30) {
    return {
      ring: 'ring-2 ring-amber-500/40',
      bg: 'bg-amber-500/10',
      glow: 'glow-amber',
      icon: Clock,
      iconColor: 'text-amber-400',
      badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      label: 'Warning',
      pulseRing: false,
    }
  }
  return {
    ring: 'ring-2 ring-emerald-500/40',
    bg: 'bg-emerald-500/10',
    glow: 'glow-green',
    icon: TrendingUp,
    iconColor: 'text-emerald-400',
    badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    label: 'Notice',
    pulseRing: false,
  }
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const hours = Math.floor(diff / 3_600_000)
  if (hours < 1) return 'Just now'
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
}

export default function NotificationsPage() {
  const shouldReduceMotion = useReducedMotion()
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS)
  const [filter, setFilter] = useState<FilterTab>('all')
  const { toast } = useToast()

  const itemVariants = {
    hidden: { opacity: 0, x: shouldReduceMotion ? 0 : 20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: 'easeOut' } },
    exit: { opacity: 0, x: shouldReduceMotion ? 0 : -16, transition: { duration: 0.2 } },
  }

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.isRead
    if (filter === 'read') return n.isRead
    return true
  })

  const unreadCount = notifications.filter((n) => !n.isRead).length

  function markAsRead(id: string) {
    try {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      )
      toast({ title: 'Marked as read', duration: 2000 })
    } catch {
      toast({ title: 'Something went wrong', variant: 'destructive' })
    }
  }

  function markAllAsRead() {
    try {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      toast({ title: 'All notifications marked as read' })
    } catch {
      toast({ title: 'Something went wrong', variant: 'destructive' })
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground text-glow">
            Notifications
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {unreadCount > 0
              ? `${unreadCount} unread renewal alert${unreadCount === 1 ? '' : 's'}`
              : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <motion.button
            onClick={markAllAsRead}
            whileTap={shouldReduceMotion ? {} : { scale: 0.93, rotate: -3 }}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-all duration-200 glass hover:text-foreground hover:bg-white/[0.08]"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all as read
          </motion.button>
        )}
      </div>

      {/* Filter tabs — glass pill bar */}
      <div className="flex gap-1 rounded-xl p-1 glass">
        {(['all', 'unread', 'read'] as FilterTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={cn(
              'flex-1 rounded-lg px-4 py-2 text-sm font-medium capitalize transition-all duration-200',
              filter === tab
                ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.06]'
            )}
          >
            {tab}
            {tab === 'unread' && unreadCount > 0 && (
              <span className="ml-1.5 rounded-full bg-white/20 px-1.5 py-0.5 text-xs font-semibold">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notification list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl glass">
            {shouldReduceMotion ? (
              <Bell className="h-8 w-8 text-muted-foreground/30" />
            ) : (
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              >
                <Bell className="h-8 w-8 text-muted-foreground/30" />
              </motion.div>
            )}
          </div>
          <h3 className="text-lg font-display font-semibold text-foreground">All caught up</h3>
          <p className="mt-1 text-sm text-muted-foreground">No renewal alerts in this category.</p>
        </div>
      ) : (
        <motion.ul
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-3"
          role="list"
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((notification) => {
              const config = getThresholdConfig(notification.threshold)
              const StatusIcon = config.icon
              // Progress: how far through the threshold window we've burned
              const progressPct = Math.min(
                100,
                ((notification.threshold - notification.daysRemaining) / notification.threshold) * 100
              )

              return (
                <motion.li
                  key={notification.id}
                  variants={itemVariants}
                  exit="exit"
                  layout
                  whileHover={shouldReduceMotion ? {} : { scale: 1.005 }}
                  className={cn(
                    'group relative overflow-hidden rounded-xl p-4 transition-all duration-200 glass',
                    'hover:-translate-y-0.5 hover:bg-white/[0.07] hover:border-white/[0.12]',
                    'hover:shadow-lg hover:shadow-indigo-500/[0.05]',
                    notification.isRead
                      ? 'opacity-60'
                      : 'gradient-border-l'
                  )}
                >
                  <div className="flex items-start gap-4">
                    {/* Traffic-light icon — with optional pulse ring */}
                    <div className="relative mt-0.5 flex-shrink-0">
                      <div
                        className={cn(
                          'flex h-12 w-12 items-center justify-center rounded-full',
                          config.bg,
                          config.ring,
                          config.glow
                        )}
                      >
                        <StatusIcon className={cn('h-6 w-6', config.iconColor)} />
                      </div>
                      {/* Animated pulse ring for critical + unread */}
                      {config.pulseRing && !notification.isRead && !shouldReduceMotion && (
                        <div className="absolute inset-0 rounded-full border-2 border-red-500/40 animate-pulse-ring" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className={cn('text-sm font-semibold text-foreground truncate', notification.isRead && 'font-medium')}>
                            {notification.contractName}
                          </p>
                          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <FileText className="h-3 w-3 flex-shrink-0" />
                            {notification.supplierName}
                          </p>
                        </div>

                        <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
                          <span
                            className={cn(
                              'rounded-full border px-2 py-0.5 text-xs font-medium',
                              config.badge
                            )}
                          >
                            {config.label}
                          </span>
                          <span className="text-[11px] text-muted-foreground/70">
                            {formatRelativeTime(notification.createdAt)}
                          </span>
                        </div>
                      </div>

                      <p className="mt-2.5 text-sm text-muted-foreground">
                        Renewal in{' '}
                        <span className={cn('font-semibold', config.iconColor)}>
                          {notification.daysRemaining} day{notification.daysRemaining === 1 ? '' : 's'}
                        </span>{' '}
                        — {notification.threshold}-day threshold reached.
                      </p>

                      {/* Urgency progress bar */}
                      <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progressPct}%` }}
                          transition={{ duration: 0.6, delay: 0.2 }}
                          className={cn(
                            'h-full rounded-full',
                            notification.threshold === 7
                              ? 'bg-red-500'
                              : notification.threshold === 30
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Mark as read button */}
                  {!notification.isRead && (
                    <div className="mt-3 flex justify-end">
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium text-indigo-400 transition-all duration-150 hover:bg-indigo-500/10 hover:text-indigo-300"
                      >
                        <CheckCheck className="h-3.5 w-3.5" />
                        Mark as read
                      </button>
                    </div>
                  )}

                  {/* Unread indicator dot */}
                  {!notification.isRead && (
                    <div className="absolute right-4 top-4 h-2 w-2 rounded-full bg-indigo-400 glow-indigo" />
                  )}
                </motion.li>
              )
            })}
          </AnimatePresence>
        </motion.ul>
      )}
    </div>
  )
}
