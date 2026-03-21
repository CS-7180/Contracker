'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  FileText,
  Building2,
  ShieldCheck,
  DollarSign,
  Bell,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { label: 'Dashboard',     href: '/dashboard',     icon: LayoutDashboard },
  { label: 'Contracts',     href: '/contracts',     icon: FileText },
  { label: 'Suppliers',     href: '/suppliers',     icon: Building2 },
  { label: 'Compliance',    href: '/compliance',    icon: ShieldCheck },
  { label: 'Spend',         href: '/spend',         icon: DollarSign },
  { label: 'Notifications', href: '/notifications', icon: Bell },
]

const pageVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col bg-sidebar text-sidebar-foreground">
        {/* Brand */}
        <div className="flex h-16 items-center px-6 border-b border-sidebar-border">
          <span className="text-lg font-semibold font-display tracking-tight text-sidebar-foreground">
            Contracker
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map(({ label, href, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top header */}
        <header className="flex h-16 items-center border-b px-6">
          <h1 className="text-sm font-medium text-muted-foreground">
            {navItems.find((n) => pathname === n.href || pathname.startsWith(n.href + '/'))?.label ?? 'Contracker'}
          </h1>
        </header>

        {/* Animated page content */}
        <motion.div
          key={pathname}
          variants={pageVariants}
          initial="hidden"
          animate="visible"
          className="flex-1 overflow-auto p-6"
        >
          {children}
        </motion.div>
      </div>
    </div>
  )
}
