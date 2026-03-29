'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, FileText, ShieldCheck, DollarSign } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const features = [
  {
    icon: FileText,
    title: 'Contract lifecycle tracking',
    desc: 'Renewals, PDFs, and key dates in one view',
    iconBg: 'bg-blue-500/25 border-blue-400/30',
    iconColor: 'text-blue-300',
  },
  {
    icon: ShieldCheck,
    title: 'Risk & compliance alerts',
    desc: 'Traffic-light indicators at 60/30/7 day thresholds',
    iconBg: 'bg-emerald-500/25 border-emerald-400/30',
    iconColor: 'text-emerald-300',
  },
  {
    icon: DollarSign,
    title: 'Spend visibility',
    desc: 'Supplier spend totals and category breakdowns',
    iconBg: 'bg-amber-500/25 border-amber-400/30',
    iconColor: 'text-amber-300',
  },
]

export default function LoginPage() {
  const router = useRouter()
  const shouldReduceMotion = useReducedMotion()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="aurora-bg flex min-h-screen">
      {/* Dot grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Desktop: Left branding panel */}
      <div className="relative z-10 hidden lg:flex lg:flex-1 flex-col justify-center px-16">
        {/* Brand lockup */}
        <div className="flex items-center gap-3 mb-10">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/40">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <span className="text-2xl font-display font-bold text-white">Contracker</span>
        </div>

        {/* Gradient headline */}
        <h2 className="mb-4 text-5xl font-display font-extrabold leading-[1.1]">
          <span className="bg-gradient-to-r from-white via-white to-indigo-200 bg-clip-text text-transparent">
            Enterprise contract
          </span>
          <br />
          <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-emerald-300 bg-clip-text text-transparent">
            intelligence
          </span>
        </h2>
        <p className="mb-12 text-lg text-zinc-300/80 max-w-md">
          Track renewals, manage suppliers, and stay compliant — all in one place.
        </p>

        {/* Colorful feature rows */}
        <div className="space-y-5">
          {features.map(({ icon: Icon, title, desc, iconBg, iconColor }) => (
            <div key={title} className="flex items-start gap-3.5">
              <div className={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border ${iconBg}`}>
                <Icon className={`h-4.5 w-4.5 ${iconColor}`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-100">{title}</p>
                <p className="mt-0.5 text-xs text-zinc-400">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Form panel */}
      <div className="relative z-10 flex flex-1 items-center justify-center p-6 lg:p-12">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          {/* Mobile brand lockup */}
          <div className="mb-8 flex flex-col items-center gap-3 lg:hidden">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/40">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-display font-bold text-white tracking-tight">
              Contracker
            </h1>
            <p className="text-sm text-zinc-400">Contract &amp; Supplier Management</p>
          </div>

          {/* Glass card — rich frost on vibrant aurora */}
          <div
            className="rounded-2xl border border-white/20 p-8"
            style={{
              background: 'rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow:
                '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.12)',
            }}
          >
            <div className="mb-6">
              <h2 className="text-xl font-display font-semibold text-white">Sign in</h2>
              <p className="mt-1 text-sm text-zinc-300/70">Enter your credentials to access your workspace</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium text-zinc-200">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 rounded-lg border-white/15 bg-white/[0.1] text-white placeholder:text-zinc-500 focus-visible:border-indigo-400 focus-visible:ring-1 focus-visible:ring-indigo-400/50"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-medium text-zinc-200">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 rounded-lg border-white/15 bg-white/[0.1] pr-10 text-white placeholder:text-zinc-500 focus-visible:border-indigo-400 focus-visible:ring-1 focus-visible:ring-indigo-400/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-zinc-400 transition-colors hover:text-zinc-200"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <p role="alert" className="text-sm text-red-400">
                  {error}
                </p>
              )}

              <motion.div
                whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
                transition={{ duration: 0.1 }}
              >
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 px-4 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all duration-200 hover:from-indigo-400 hover:to-violet-500 hover:shadow-xl hover:shadow-indigo-500/40 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? 'Signing in…' : 'Sign in'}
                </button>
              </motion.div>
            </form>

            <p className="mt-6 text-center text-sm text-zinc-400">
              Don&apos;t have an account?{' '}
              <Link
                href="/signup"
                className="font-medium text-indigo-400 transition-colors hover:text-indigo-300"
              >
                Sign up
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
