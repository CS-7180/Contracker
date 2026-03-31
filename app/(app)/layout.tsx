'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion'
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
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { label: 'Dashboard',     href: '/dashboard',     icon: LayoutDashboard },
  { label: 'Contracts',     href: '/contracts',     icon: FileText },
  { label: 'Suppliers',     href: '/suppliers',     icon: Building2 },
  { label: 'Compliance',    href: '/compliance',    icon: ShieldCheck },
  { label: 'Spend',         href: '/spend',         icon: DollarSign },
  { label: 'Notifications', href: '/notifications', icon: Bell },
]

function SidebarUserFooter() {
  const router = useRouter()
  const [user, setUser] = useState<{ email: string; full_name?: string } | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser({
          email: data.user.email ?? '',
          full_name: data.user.user_metadata?.full_name,
        })
      }
    })
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const initials = user?.full_name
    ? user.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? 'U'

  return (
    <div className="mt-auto border-t border-white/[0.06] px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/30 to-violet-500/30 ring-1 ring-white/[0.15] text-xs font-bold text-indigo-300">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-sidebar-foreground/80">
            {user?.full_name ?? user?.email?.split('@')[0] ?? 'User'}
          </p>
          <p className="truncate text-[10px] text-sidebar-foreground/40">{user?.email ?? ''}</p>
        </div>
        <div className="flex items-center gap-0.5">
          <Link
            href="/settings/team"
            className="rounded-md p-1.5 text-sidebar-foreground/40 transition-colors hover:bg-white/[0.06] hover:text-sidebar-foreground/70"
            title="Settings"
          >
            <Settings className="h-3.5 w-3.5" />
          </Link>
          <button
            onClick={handleLogout}
            className="rounded-md p-1.5 text-sidebar-foreground/40 transition-colors hover:bg-red-500/10 hover:text-red-400"
            title="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

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
    <div className="relative flex h-screen overflow-hidden bg-background">
      {/* ── Subtle aurora background for the entire app shell ── */}
      <div className="aurora-app-bg" aria-hidden="true" />
      <div className="aurora-app-dot-grid" aria-hidden="true" />

      {/* ── Sidebar ── */}
      <aside
        className="relative z-10 flex w-64 shrink-0 flex-col text-sidebar-foreground"
        style={{
          background: 'linear-gradient(180deg, rgba(20,20,24,0.95) 0%, rgba(12,12,15,0.98) 100%)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Brand lockup */}
        <div className="flex h-16 items-center gap-3 border-b border-white/[0.06] px-5">
          <motion.div
            animate={shouldReduceMotion ? {} : {
              boxShadow: [
                '0 0 0px rgba(99,102,241,0)',
                '0 0 16px rgba(99,102,241,0.4)',
                '0 0 0px rgba(99,102,241,0)',
              ],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/25"
          >
            <FileText className="h-5 w-5 text-white" />
          </motion.div>
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
                  <motion.div
                    animate={
                      isActive && !shouldReduceMotion
                        ? {
                            boxShadow: [
                              '0 0 0px rgba(99,102,241,0)',
                              '0 0 12px rgba(99,102,241,0.2)',
                              '0 0 0px rgba(99,102,241,0)',
                            ],
                          }
                        : {}
                    }
                    transition={{ duration: 2.5, repeat: Infinity }}
                    className="rounded-lg"
                  >
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
                      <motion.span
                        className="flex-shrink-0"
                        whileHover={shouldReduceMotion ? {} : { rotate: 8, scale: 1.15 }}
                        transition={{ duration: 0.2, type: 'spring' }}
                      >
                        <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                      </motion.span>
                      <motion.span
                        whileHover={shouldReduceMotion ? {} : { x: 2 }}
                        transition={{ duration: 0.15 }}
                      >
                        {label}
                      </motion.span>
                    </Link>
                  </motion.div>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* User footer with real session data + logout */}
        <SidebarUserFooter />
      </aside>

      {/* ── Main content ── */}
      <div className="relative z-10 flex flex-1 flex-col overflow-hidden">
        {/* Top header — glass effect */}
        <header
          className="relative flex h-14 items-center justify-between border-b border-white/[0.06] px-6 backdrop-blur-xl"
          style={{ background: 'rgba(12, 12, 15, 0.7)' }}
        >
          {/* Left: page icon + animated heading */}
          <div className="flex items-center gap-2.5">
            <CurrentIcon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <AnimatePresence mode="wait">
              <motion.h1
                key={pathname}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.2 }}
                className="text-sm font-display font-semibold text-foreground"
              >
                {currentPage}
              </motion.h1>
            </AnimatePresence>
          </div>

          {/* Right: search, bell, avatar */}
          <div className="flex items-center gap-1">
            <button className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground">
              <Search className="h-4 w-4" />
            </button>
            <Link
              href="/notifications"
              className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
            >
              <Bell className="h-4 w-4" />
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                className={cn(
                  'absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-indigo-400',
                  'animate-badge-pulse'
                )}
              />
            </Link>
            <div className="ml-2 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/20 to-violet-500/20 ring-1 ring-white/[0.12]">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </div>

          {/* Bottom gradient glow line — sweeping beam effect */}
          <div
            className="absolute bottom-0 left-0 right-0 h-px animate-gradient-shift bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent"
            style={{ backgroundSize: '200% 100%' }}
          />
        </header>

        {/* Animated page content */}
        <motion.main
          key={pathname}
          variants={pageVariants}
          initial="hidden"
          animate="visible"
          className="relative flex-1 overflow-auto p-6"
        >
          {children}
        </motion.main>
      </div>
    </div>
  )
}
