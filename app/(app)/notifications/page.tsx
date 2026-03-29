'use client'

import { useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Bell, FileText, CheckCheck, AlertTriangle, Clock, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

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
      icon: AlertTriangle,
      iconColor: 'text-red-500',
      badge: 'bg-red-50 text-red-700 border-red-200',
      label: 'Critical',
    }
  }
  if (threshold === 30) {
    return {
      ring: 'ring-2 ring-amber-500/40',
      bg: 'bg-amber-500/10',
      icon: Clock,
      iconColor: 'text-amber-500',
      badge: 'bg-amber-50 text-amber-700 border-amber-200',
      label: 'Warning',
    }
  }
  return {
    ring: 'ring-2 ring-green-500/40',
    bg: 'bg-green-500/10',
    icon: TrendingUp,
    iconColor: 'text-green-500',
    badge: 'bg-green-50 text-green-700 border-green-200',
    label: 'Notice',
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
    transition: { staggerChildren: 0.05 },
  },
}

export default function NotificationsPage() {
  const shouldReduceMotion = useReducedMotion()
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS)
  const [filter, setFilter] = useState<FilterTab>('all')

  const itemVariants = {
    hidden: { opacity: 0, x: shouldReduceMotion ? 0 : 16 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.25, ease: 'easeOut' } },
    exit: { opacity: 0, x: shouldReduceMotion ? 0 : -12, transition: { duration: 0.15 } },
  }

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.isRead
    if (filter === 'read') return n.isRead
    return true
  })

  const unreadCount = notifications.filter((n) => !n.isRead).length

  function markAsRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    )
  }

  function markAllAsRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Notifications</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {unreadCount > 0
              ? `${unreadCount} unread renewal alert${unreadCount === 1 ? '' : 's'}`
              : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <motion.button
            onClick={markAllAsRead}
            whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <CheckCheck className="h-4 w-4 text-muted-foreground" />
            Mark all as read
          </motion.button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 rounded-xl border border-border bg-card p-1">
        {(['all', 'unread', 'read'] as FilterTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={cn(
              'flex-1 rounded-lg px-4 py-2 text-sm font-medium capitalize transition-all duration-150',
              filter === tab
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {tab}
            {tab === 'unread' && unreadCount > 0 && (
              <span className="ml-1.5 rounded-full bg-primary-foreground/20 px-1.5 py-0.5 text-xs font-semibold">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notification list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Bell className="mb-4 h-12 w-12 text-muted-foreground/30" />
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

              return (
                <motion.li
                  key={notification.id}
                  variants={itemVariants}
                  exit="exit"
                  layout
                  whileHover={shouldReduceMotion ? {} : { scale: 1.005 }}
                  className={cn(
                    'group relative overflow-hidden rounded-xl border bg-card p-4 transition-shadow duration-150 hover:shadow-md',
                    notification.isRead
                      ? 'border-border opacity-70'
                      : 'border-border border-l-4 border-l-primary'
                  )}
                >
                  <div className="flex items-start gap-4">
                    {/* Traffic-light icon */}
                    <div
                      className={cn(
                        'mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full',
                        config.bg,
                        config.ring
                      )}
                    >
                      <StatusIcon className={cn('h-5 w-5', config.iconColor)} />
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

                        <div className="flex flex-shrink-0 flex-col items-end gap-1">
                          <span
                            className={cn(
                              'rounded-full border px-2 py-0.5 text-xs font-medium',
                              config.badge
                            )}
                          >
                            {config.label}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatRelativeTime(notification.createdAt)}
                          </span>
                        </div>
                      </div>

                      <p className="mt-2 text-sm text-muted-foreground">
                        Renewal in{' '}
                        <span className={cn('font-semibold', config.iconColor)}>
                          {notification.daysRemaining} day{notification.daysRemaining === 1 ? '' : 's'}
                        </span>{' '}
                        — {notification.threshold}-day threshold reached.
                      </p>
                    </div>
                  </div>

                  {/* Mark as read button */}
                  {!notification.isRead && (
                    <div className="mt-3 flex justify-end">
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary/70"
                      >
                        <CheckCheck className="h-3.5 w-3.5" />
                        Mark as read
                      </button>
                    </div>
                  )}

                  {/* Unread indicator dot */}
                  {!notification.isRead && (
                    <div className="absolute right-4 top-4 h-2 w-2 rounded-full bg-primary" />
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
