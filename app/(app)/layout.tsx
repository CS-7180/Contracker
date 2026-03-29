'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, useReducedMotion } from 'framer-motion'
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

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const shouldReduceMotion = useReducedMotion()

  const pageVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 8 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: shouldReduceMotion ? 0 : 0.25, ease: 'easeOut' },
    },
  }

  const currentPage =
    navItems.find((n) => pathname === n.href || pathname.startsWith(n.href + '/'))?.label ??
    'Contracker'

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* ── Sidebar ── */}
      <aside className="flex w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
        {/* Brand lockup */}
        <div className="flex h-14 items-center gap-2.5 border-b border-sidebar-border px-5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
            <FileText className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-base font-display font-semibold tracking-tight text-sidebar-foreground">
            Contracker
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-3" aria-label="Main navigation">
          <ul className="space-y-0.5" role="list">
            {navItems.map(({ label, href, icon: Icon }) => {
              const isActive = pathname === href || pathname.startsWith(href + '/')
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150',
                      isActive
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                        : 'text-sidebar-foreground/60 hover:bg-sidebar-border/60 hover:text-sidebar-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Footer spacer */}
        <div className="h-4" />
      </aside>

      {/* ── Main content ── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top header */}
        <header className="flex h-14 items-center border-b bg-card px-6">
          <h1 className="text-sm font-display font-semibold text-foreground">{currentPage}</h1>
        </header>

        {/* Animated page content */}
        <motion.main
          key={pathname}
          variants={pageVariants}
          initial="hidden"
          animate="visible"
          className="flex-1 overflow-auto p-6"
        >
          {children}
        </motion.main>
      </div>
    </div>
  )
}
