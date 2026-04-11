'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell } from 'lucide-react'
import { motion } from 'framer-motion'

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0)
  const pathname = usePathname()

  useEffect(() => {
    async function fetchUnread() {
      try {
        const res = await fetch('/api/notifications')
        if (!res.ok) return
        const json = await res.json()
        setUnreadCount(
          Array.isArray(json.data)
            ? json.data.filter((n: { is_read: boolean }) => !n.is_read).length
            : 0
        )
      } catch {
        // silently ignore — bell just shows no badge
      }
    }
    fetchUnread()
  }, [pathname]) // refetch whenever navigating to/from /notifications

  return (
    <Link
      href="/notifications"
      className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
    >
      <Bell className="h-4 w-4" />
      {unreadCount > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-indigo-400 animate-badge-pulse"
        />
      )}
    </Link>
  )
}
