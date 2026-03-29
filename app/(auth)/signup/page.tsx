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
  },
  {
    icon: ShieldCheck,
    title: 'Risk & compliance alerts',
    desc: 'Traffic-light indicators at 60/30/7 day thresholds',
  },
  {
    icon: DollarSign,
    title: 'Spend visibility',
    desc: 'Supplier spend totals and category breakdowns',
  },
]

export default function SignupPage() {
  const router = useRouter()
  const shouldReduceMotion = useReducedMotion()

  const [fullName, setFullName] = useState('')
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
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <div
      className="relative flex min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900"
      style={{
        backgroundImage:
          'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
    >
      {/* Animated orbs */}
      {!shouldReduceMotion && (
        <>
          <motion.div
            className="pointer-events-none absolute -top-32 -left-32 h-[32rem] w-[32rem] rounded-full bg-indigo-500/20 blur-3xl"
            animate={{ y: [0, -30, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-violet-500/20 blur-3xl"
            animate={{ x: [0, 20, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="pointer-events-none absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-400/10 blur-3xl"
            animate={{ x: [0, 16, 0], y: [0, -16, 0] }}
            transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          />
        </>
      )}

      {/* Desktop: Left branding panel */}
      <div className="hidden lg:flex lg:flex-1 flex-col justify-center px-16 relative z-10">
        {/* Brand lockup */}
        <div className="flex items-center gap-3 mb-10">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <span className="text-2xl font-display font-bold text-white">Contracker</span>
        </div>

        <h2 className="mb-3 text-4xl font-display font-bold leading-tight text-white">
          Start managing<br />contracts today
        </h2>
        <p className="mb-10 text-lg text-indigo-200/70">
          Join organizations that trust Contracker for their contract and supplier intelligence.
        </p>

        <div className="space-y-5">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-indigo-400/20 bg-indigo-500/20">
                <Icon className="h-4 w-4 text-indigo-300" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">{title}</p>
                <p className="mt-0.5 text-xs text-indigo-200/60">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Form panel */}
      <div className="relative z-10 flex flex-1 items-center justify-center p-6 lg:p-12">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          {/* Mobile brand lockup */}
          <div className="mb-8 flex flex-col items-center gap-3 lg:hidden">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-display font-bold text-white tracking-tight">
              Contracker
            </h1>
            <p className="text-sm text-indigo-200/60">Contract &amp; Supplier Management</p>
          </div>

          {/* Glass card */}
          <div
            className="rounded-2xl border border-white/[0.12] p-8"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              boxShadow:
                '0 8px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
            }}
          >
            {/* Card header */}
            <div className="mb-6">
              <h2 className="text-xl font-display font-semibold text-white">Create an account</h2>
              <p className="mt-1 text-sm text-white/50">Set up your organization workspace</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="full-name" className="text-sm font-medium text-white/70">
                  Full name
                </Label>
                <Input
                  id="full-name"
                  type="text"
                  placeholder="Jane Doe"
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="h-11 rounded-lg border-white/20 bg-white/[0.08] text-white placeholder:text-white/30 focus-visible:border-indigo-400 focus-visible:ring-1 focus-visible:ring-indigo-400/40"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium text-white/70">
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
                  className="h-11 rounded-lg border-white/20 bg-white/[0.08] text-white placeholder:text-white/30 focus-visible:border-indigo-400 focus-visible:ring-1 focus-visible:ring-indigo-400/40"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-medium text-white/70">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min. 6 characters"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="h-11 rounded-lg border-white/20 bg-white/[0.08] pr-10 text-white placeholder:text-white/30 focus-visible:border-indigo-400 focus-visible:ring-1 focus-visible:ring-indigo-400/40"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-white/40 transition-colors hover:text-white/70"
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
                  className="w-full h-11 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 px-4 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all duration-150 hover:from-indigo-400 hover:to-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? 'Creating account…' : 'Sign up'}
                </button>
              </motion.div>
            </form>

            <p className="mt-6 text-center text-sm text-white/50">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-medium text-indigo-400 transition-colors hover:text-indigo-300"
              >
                Sign in
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
