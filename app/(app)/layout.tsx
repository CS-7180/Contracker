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
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { NotificationBell } from '@/components/shared/NotificationBell'

const navItems = [
  { label: 'Dashboard',     href: '/dashboard',     icon: LayoutDashboard },
  { label: 'Contracts',     href: '/contracts',     icon: FileText },
  { label: 'Suppliers',     href: '/suppliers',     icon: Building2 },
  { label: 'Compliance',    href: '/compliance',    icon: ShieldCheck },
  { label: 'Spend',         href: '/spend',         icon: DollarSign },
  { label: 'Notifications', href: '/notifications', icon: Bell },
]

// Icon accent colours per nav item for the active icon wrapper
const NAV_ACCENT: Record<string, { bg: string; text: string; glow: string }> = {
  '/dashboard':     { bg: 'from-indigo-500/30 to-violet-500/20',   text: 'text-indigo-300',  glow: 'rgba(99,102,241,0.4)' },
  '/contracts':     { bg: 'from-blue-500/30 to-cyan-500/20',       text: 'text-blue-300',    glow: 'rgba(59,130,246,0.4)' },
  '/suppliers':     { bg: 'from-violet-500/30 to-purple-500/20',   text: 'text-violet-300',  glow: 'rgba(139,92,246,0.4)' },
  '/compliance':    { bg: 'from-emerald-500/30 to-teal-500/20',    text: 'text-emerald-300', glow: 'rgba(16,185,129,0.4)' },
  '/spend':         { bg: 'from-amber-500/30 to-orange-500/20',    text: 'text-amber-300',   glow: 'rgba(245,158,11,0.4)' },
  '/notifications': { bg: 'from-rose-500/30 to-pink-500/20',       text: 'text-rose-300',    glow: 'rgba(244,63,94,0.4)' },
}

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
    <div className="mt-auto flex-shrink-0">
      {/* Gradient divider line */}
      <div className="mx-4 h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent mb-3" />
      <div className="px-4 pb-4">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-white/[0.04]">
          {/* Avatar — full gradient */}
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-bold text-white shadow-md shadow-indigo-500/30 ring-1 ring-white/20">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-sidebar-foreground/90">
              {user?.full_name ?? user?.email?.split('@')[0] ?? 'User'}
            </p>
            <p className="truncate text-[10px] text-sidebar-foreground/40">{user?.email ?? ''}</p>
          </div>
          <div className="flex items-center gap-0.5">
            <Link
              href="/settings/team"
              className="rounded-md p-1.5 text-sidebar-foreground/30 transition-all hover:bg-white/[0.06] hover:text-sidebar-foreground/70"
              title="Settings"
            >
              <Settings className="h-3.5 w-3.5" />
            </Link>
            <button
              onClick={handleLogout}
              className="rounded-md p-1.5 text-sidebar-foreground/30 transition-all hover:bg-red-500/15 hover:text-red-400"
              title="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
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
      {/* ── Aurora background ── */}
      <div className="aurora-app-bg" aria-hidden="true" />
      <div className="aurora-app-dot-grid" aria-hidden="true" />

      {/* ── Sidebar ── */}
      <aside
        className="relative z-10 flex w-64 shrink-0 flex-col text-sidebar-foreground"
        style={{
          background: 'linear-gradient(180deg, rgba(10,8,22,0.97) 0%, rgba(6,6,14,0.99) 100%)',
          borderRight: '1px solid rgba(255,255,255,0.07)',
          backdropFilter: 'blur(24px)',
        }}
      >
        {/* Brand lockup */}
        <div className="flex h-16 items-center gap-3 px-5">
          <motion.div
            animate={shouldReduceMotion ? {} : {
              boxShadow: [
                '0 0 0px rgba(99,102,241,0)',
                '0 0 20px rgba(99,102,241,0.5)',
                '0 0 0px rgba(99,102,241,0)',
              ],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30"
          >
            <FileText className="h-5 w-5 text-white" />
          </motion.div>
          <div className="flex flex-col">
            <span className="text-[15px] font-display font-bold tracking-tight text-white" style={{ textShadow: '0 0 20px rgba(129,140,248,0.4)' }}>
              Contracker
            </span>
            <span className="flex items-center gap-1 text-[9px] text-indigo-400/70 uppercase tracking-widest font-medium">
              <Sparkles className="h-2.5 w-2.5" />
              Contract Intelligence
            </span>
          </div>
        </div>

        {/* Gradient divider */}
        <div className="mx-4 mb-2 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />

        {/* Navigation */}
        <nav className="flex-1 px-3 py-1" aria-label="Main navigation">
          {/* Section label */}
          <p className="px-3 pt-1 pb-2 text-[9px] font-semibold uppercase tracking-[0.2em] text-white/20">Menu</p>
          <ul className="space-y-0.5" role="list">
            {navItems.map(({ label, href, icon: Icon }) => {
              const isActive = pathname === href || pathname.startsWith(href + '/')
              const accent = NAV_ACCENT[href] ?? NAV_ACCENT['/dashboard']

              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'text-white'
                        : 'text-sidebar-foreground/45 hover:text-sidebar-foreground/80 hover:bg-white/[0.05]'
                    )}
                    style={isActive ? {
                      background: 'linear-gradient(90deg, rgba(99,102,241,0.18) 0%, rgba(139,92,246,0.08) 60%, transparent 100%)',
                      boxShadow: `inset 3px 0 0 ${accent.glow.replace('0.4', '0.8')}, 0 0 16px rgba(99,102,241,0.08)`,
                    } : {}}
                  >
                    {/* Icon wrapper */}
                    <motion.div
                      whileHover={shouldReduceMotion ? {} : { rotate: 6, scale: 1.1 }}
                      transition={{ duration: 0.2, type: 'spring' }}
                      className={cn(
                        'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg transition-all duration-200',
                        isActive
                          ? `bg-gradient-to-br ${accent.bg} border border-white/[0.10]`
                          : 'group-hover:bg-white/[0.06]'
                      )}
                    >
                      <Icon
                        className={cn(
                          'h-[15px] w-[15px] transition-colors duration-200',
                          isActive ? accent.text : 'text-sidebar-foreground/40 group-hover:text-sidebar-foreground/70'
                        )}
                        aria-hidden="true"
                      />
                    </motion.div>

                    {/* Label */}
                    <motion.span
                      whileHover={shouldReduceMotion ? {} : { x: 2 }}
                      transition={{ duration: 0.15 }}
                      className={cn(isActive && 'font-semibold')}
                    >
                      {label}
                    </motion.span>

                    {/* Active glow pulse on the right */}
                    {isActive && !shouldReduceMotion && (
                      <motion.div
                        className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-400"
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* User footer */}
        <SidebarUserFooter />
      </aside>

      {/* ── Main content ── */}
      <div className="relative z-10 flex flex-1 flex-col overflow-hidden">
        {/* Top header */}
        <header
          className="relative flex h-14 items-center justify-between border-b px-6 backdrop-blur-xl"
          style={{
            background: 'rgba(6,8,17,0.75)',
            borderColor: 'rgba(255,255,255,0.07)',
          }}
        >
          <div className="flex items-center gap-2.5">
            <CurrentIcon className="h-4 w-4 text-muted-foreground/60" aria-hidden="true" />
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

          <div className="flex items-center gap-1">
            <button className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground">
              <Search className="h-4 w-4" />
            </button>
            <NotificationBell />
            <div className="ml-2 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/25 to-violet-500/25 ring-1 ring-white/[0.12]">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </div>

          {/* Bottom sweep line */}
          <div
            className="absolute bottom-0 left-0 right-0 h-px animate-gradient-shift bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent"
            style={{ backgroundSize: '200% 100%' }}
          />
        </header>

        {/* Page content */}
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
