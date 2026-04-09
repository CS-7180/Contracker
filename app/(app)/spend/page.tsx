'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { DollarSign, TrendingUp, BarChart2, Filter } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

type Period = 'all' | 'year' | 'custom'

type SupplierSpend = { supplier_id: string; supplier_name: string; total: number }
type CategorySpend = { category: string; total: number }

type SpendData = {
  bySupplier: SupplierSpend[]
  byCategory: CategorySpend[]
}

const CURRENT_YEAR = new Date().getFullYear()

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

export default function SpendPage() {
  const shouldReduceMotion = useReducedMotion()
  const [period, setPeriod] = useState<Period>('all')
  const [data, setData] = useState<SpendData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSpend = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ period })
      const res = await fetch(`/api/spend?${params}`)
      const json = await res.json()
      if (!res.ok || json.error) {
        setError(json.error?.message ?? 'Failed to load spend data')
        return
      }
      setData(json.data)
    } catch {
      setError('Network error — please try again')
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => { fetchSpend() }, [fetchSpend])

  const grandTotal = data?.bySupplier.reduce((sum, s) => sum + s.total, 0) ?? 0
  const topSuppliers = (data?.bySupplier ?? []).slice(0, 10).map(s => ({
    name: s.supplier_name,
    total: s.total,
  }))

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-display font-bold tracking-tight text-foreground text-glow">
            Spend Intelligence
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Contract value analysis across your supplier portfolio
          </p>
        </div>

        {/* Period filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          {(['all', 'year'] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                'rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                period === p
                  ? 'border-primary/30 bg-primary/10 text-primary'
                  : 'border-white/[0.06] bg-white/[0.03] text-muted-foreground hover:text-foreground',
              )}
            >
              {p === 'all' ? 'All time' : `${CURRENT_YEAR}`}
            </button>
          ))}
        </div>
      </div>

      {/* Grand total stat */}
      <motion.div
        className="flex items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.03] px-5 py-4"
        initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
          <DollarSign className="h-5 w-5 text-emerald-400" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Total portfolio spend</p>
          <p className="text-2xl font-bold text-foreground">
            {loading ? (
              <span className="inline-block h-7 w-28 animate-pulse rounded bg-white/10" />
            ) : (
              formatCurrency(grandTotal)
            )}
          </p>
        </div>
        <div className="ml-auto text-xs text-muted-foreground">
          {loading ? '' : `${data?.bySupplier.length ?? 0} suppliers`}
        </div>
      </motion.div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="h-48 animate-pulse rounded-xl bg-white/[0.03]" />
          ))}
        </div>
      ) : !data || data.bySupplier.length === 0 ? (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] py-16 text-center">
          <BarChart2 className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">
            No spend data found for the selected period.
          </p>
        </div>
      ) : (
        <motion.div
          className="space-y-6"
          variants={shouldReduceMotion ? undefined : containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Top suppliers bar chart */}
          <motion.div
            variants={shouldReduceMotion ? undefined : itemVariants}
            className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5"
          >
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-foreground">
                Top {topSuppliers.length} Suppliers by Spend
              </h3>
            </div>
            <ResponsiveContainer
              width="100%"
              height={Math.max(300, topSuppliers.length * 44)}
            >
              <BarChart
                data={topSuppliers}
                layout="vertical"
                margin={{ top: 0, right: 24, bottom: 0, left: 120 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  type="number"
                  tickFormatter={(v) => formatCurrency(v)}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={110}
                  tick={{ fontSize: 11, fill: 'hsl(var(--foreground))' }}
                />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), 'Spend']}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Supplier breakdown table */}
          <motion.div
            variants={shouldReduceMotion ? undefined : itemVariants}
            className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden"
          >
            <div className="border-b border-white/[0.06] px-5 py-3.5 flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-indigo-400" />
              <h3 className="text-sm font-semibold text-foreground">Supplier Breakdown</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="px-5 py-2.5 text-left text-xs font-medium text-muted-foreground">Supplier</th>
                  <th className="px-5 py-2.5 text-right text-xs font-medium text-muted-foreground">Total Spend</th>
                  <th className="px-5 py-2.5 text-right text-xs font-medium text-muted-foreground">Share</th>
                </tr>
              </thead>
              <tbody>
                {data.bySupplier.map((s, i) => {
                  const share = grandTotal > 0 ? (s.total / grandTotal) * 100 : 0
                  return (
                    <tr
                      key={s.supplier_id}
                      className={cn(
                        'border-b border-white/[0.04] transition-colors hover:bg-white/[0.02]',
                        i === data.bySupplier.length - 1 && 'border-b-0',
                      )}
                    >
                      <td className="px-5 py-3 font-medium text-foreground">{s.supplier_name}</td>
                      <td className="px-5 py-3 text-right font-mono text-foreground">
                        {formatCurrency(s.total)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-white/[0.06]">
                            <div
                              className="h-full rounded-full bg-emerald-500/60"
                              style={{ width: `${share}%` }}
                            />
                          </div>
                          <span className="w-10 text-right text-xs text-muted-foreground">
                            {share.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </motion.div>

          {/* Category breakdown table */}
          <motion.div
            variants={shouldReduceMotion ? undefined : itemVariants}
            className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden"
          >
            <div className="border-b border-white/[0.06] px-5 py-3.5 flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-violet-400" />
              <h3 className="text-sm font-semibold text-foreground">Category Breakdown</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="px-5 py-2.5 text-left text-xs font-medium text-muted-foreground">Category</th>
                  <th className="px-5 py-2.5 text-right text-xs font-medium text-muted-foreground">Total Spend</th>
                  <th className="px-5 py-2.5 text-right text-xs font-medium text-muted-foreground">Share</th>
                </tr>
              </thead>
              <tbody>
                {data.byCategory.map((c, i) => {
                  const share = grandTotal > 0 ? (c.total / grandTotal) * 100 : 0
                  return (
                    <tr
                      key={c.category}
                      className={cn(
                        'border-b border-white/[0.04] transition-colors hover:bg-white/[0.02]',
                        i === data.byCategory.length - 1 && 'border-b-0',
                      )}
                    >
                      <td className="px-5 py-3 font-medium text-foreground">{c.category}</td>
                      <td className="px-5 py-3 text-right font-mono text-foreground">
                        {formatCurrency(c.total)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-white/[0.06]">
                            <div
                              className="h-full rounded-full bg-violet-500/60"
                              style={{ width: `${share}%` }}
                            />
                          </div>
                          <span className="w-10 text-right text-xs text-muted-foreground">
                            {share.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
