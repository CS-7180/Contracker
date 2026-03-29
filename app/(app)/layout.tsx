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
  Search,
  Settings,
  User,
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

  const currentNav = navItems.find(
    (n) => pathname === n.href || pathname.startsWith(n.href + '/')
  )
  const currentPage = currentNav?.label ?? 'Contracker'
  const CurrentIcon = currentNav?.icon ?? FileText

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* ── Sidebar ── */}
      <aside
        className="flex w-64 shrink-0 flex-col text-sidebar-foreground"
        style={{
          background: 'linear-gradient(180deg, #141418 0%, #0c0c0f 100%)',
        }}
      >
        {/* Brand lockup */}
        <div className="flex h-16 items-center gap-3 border-b border-white/[0.06] px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/25">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-display font-bold tracking-tight text-sidebar-foreground text-glow-sm">
            Contracker
          </span>
        </div>

        {/* Gradient separator */}
        <div className="gradient-line mx-5 mt-3 mb-1" />

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2" aria-label="Main navigation">
          <ul className="space-y-1" role="list">
            {navItems.map(({ label, href, icon: Icon }) => {
              const isActive = pathname === href || pathname.startsWith(href + '/')
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'gradient-border-l bg-white/[0.08] text-sidebar-foreground text-glow-sm shadow-sm shadow-indigo-500/10'
                        : 'text-sidebar-foreground/50 hover:text-sidebar-foreground/80 hover:bg-white/[0.04]'
                    )}
                  >
                    <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                    {label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* User footer */}
        <div className="mt-auto border-t border-white/[0.06] px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/20 to-violet-500/20 ring-1 ring-white/[0.12]">
              <User className="h-4 w-4 text-sidebar-foreground/70" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-sidebar-foreground/80">User</p>
              <p className="truncate text-[10px] text-sidebar-foreground/40">user@contracker.dev</p>
            </div>
            <button className="rounded-md p-1.5 text-sidebar-foreground/40 transition-colors hover:bg-white/[0.06] hover:text-sidebar-foreground/70">
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top header — glass effect */}
        <header className="relative flex h-14 items-center justify-between border-b border-white/[0.06] px-6 backdrop-blur-xl"
          style={{ background: 'rgba(19, 19, 22, 0.6)' }}
        >
          {/* Left: page icon + heading */}
          <div className="flex items-center gap-2.5">
            <CurrentIcon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <h1 className="text-sm font-display font-semibold text-foreground">{currentPage}</h1>
          </div>

          {/* Right: search, bell, avatar */}
          <div className="flex items-center gap-1">
            <button className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground">
              <Search className="h-4 w-4" />
            </button>
            <button className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground">
              <Bell className="h-4 w-4" />
              <span
                className={cn(
                  'absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-indigo-400',
                  !shouldReduceMotion && 'animate-badge-pulse'
                )}
              />
            </button>
            <div className="ml-2 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/20 to-violet-500/20 ring-1 ring-white/[0.12]">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </div>

          {/* Bottom gradient glow line */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
        </header>

        {/* Animated page content */}
        <motion.main
          key={pathname}
          variants={pageVariants}
          initial="hidden"
          animate="visible"
          className="relative flex-1 overflow-auto p-6"
          style={{
            backgroundImage: `
              radial-gradient(ellipse at 90% 90%, rgba(99,102,241,0.06) 0%, transparent 50%),
              radial-gradient(ellipse at 10% 10%, rgba(139,92,246,0.04) 0%, transparent 50%)`,
          }}
        >
          {children}
        </motion.main>
      </div>
    </div>
  )
}
