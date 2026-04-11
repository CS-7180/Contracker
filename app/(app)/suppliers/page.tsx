import Link from 'next/link'
import { Plus, Building2, ArrowRight, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { SuppliersSearch } from '@/components/suppliers/SuppliersSearch'
import { RiskIndicator } from '@/components/ui/RiskIndicator'
import { getRiskColour } from '@/lib/risk'
import type { RiskColour } from '@/lib/risk'
import { cn } from '@/lib/utils'

interface PageProps {
  searchParams: { search?: string }
}

const AVATAR_GRADIENTS = [
  'from-indigo-500 to-violet-600',
  'from-blue-500 to-cyan-600',
  'from-emerald-500 to-teal-600',
  'from-violet-500 to-purple-600',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-600',
]

export default async function SuppliersPage({ searchParams }: PageProps) {
  const supabase = createClient()
  const search = searchParams.search as string | undefined

  let query = (supabase.from('suppliers') as any)
    .select('id, name, category, status, contact_email, contracts(renewal_date, notice_period_days, end_date)')
    .order('name')

  if (search) query = query.ilike('name', `%${search}%`)

  const { data: rawSuppliers } = await query as {
    data: Array<{
      id: string
      name: string
      category: string | null
      status: string
      contact_email: string | null
      contracts: Array<{ renewal_date: string; notice_period_days: number; end_date: string }>
    }> | null
  }

  const today = new Date()
  const suppliers = rawSuppliers?.map(({ contracts, ...s }) => {
    let max_contract_risk: RiskColour | null = null
    if (contracts && contracts.length > 0) {
      const risks = contracts.map((c) =>
        getRiskColour(new Date(c.renewal_date), c.notice_period_days, today)
      )
      max_contract_risk = risks.includes('red') ? 'red'
        : risks.includes('amber') ? 'amber'
        : 'green'
    }
    return { ...s, max_contract_risk }
  }) ?? null

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold tracking-tight text-foreground text-glow">
            Suppliers
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your supplier relationships
          </p>
        </div>
        <div className="flex items-center gap-3">
          <SuppliersSearch />
          <Button asChild className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white hover:brightness-110 border-0 shadow-lg shadow-indigo-500/20">
            <Link href="/suppliers/new">
              <Plus className="mr-2 h-4 w-4" />
              New Supplier
            </Link>
          </Button>
        </div>
      </div>

      {/* Empty state */}
      {!suppliers || suppliers.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.02] py-20 text-center backdrop-blur-xl">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/10 to-indigo-500/10 border border-white/[0.08]">
            <Building2 className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <p className="text-base font-medium text-foreground/60">
            {search ? `No suppliers matching "${search}"` : 'No suppliers yet'}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {search ? 'Try a different search term' : 'Add your first supplier to get started'}
          </p>
          {!search && (
            <Button asChild variant="outline" className="mt-5 border-violet-500/30 text-violet-300 hover:bg-violet-500/10">
              <Link href="/suppliers/new">Add your first supplier</Link>
            </Button>
          )}
        </div>
      ) : (
        <div
          className="overflow-hidden rounded-2xl border border-white/[0.08] backdrop-blur-xl"
          style={{ background: 'rgba(255,255,255,0.02)' }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr
                style={{ background: 'linear-gradient(90deg, rgba(139,92,246,0.08) 0%, rgba(99,102,241,0.04) 50%, rgba(255,255,255,0.02) 100%)' }}
                className="border-b border-white/[0.08]"
              >
                <th className="px-5 py-3.5 text-left">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/60">Supplier</span>
                </th>
                <th className="px-5 py-3.5 text-left">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/60">Category</span>
                </th>
                <th className="px-5 py-3.5 text-left">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/60">Contact</span>
                </th>
                <th className="px-5 py-3.5 text-left">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/60">Status</span>
                </th>
                <th className="px-5 py-3.5 text-left">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/60">Contract Risk</span>
                </th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {suppliers.map((s, index) => {
                const gradient = AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length]
                const initials = s.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
                const isActive = s.status === 'active'

                return (
                  <tr
                    key={s.id}
                    className="group transition-all duration-200 hover:bg-gradient-to-r hover:from-violet-500/[0.05] hover:to-transparent"
                  >
                    {/* Supplier with gradient avatar */}
                    <td className="px-5 py-4">
                      <Link href={`/suppliers/${s.id}`} className="group/link flex items-center gap-3">
                        <div className={cn(
                          'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-xs font-bold text-white shadow-md',
                          gradient
                        )}>
                          {initials}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-foreground transition-colors group-hover/link:text-violet-300 flex items-center gap-1.5 truncate">
                            {s.name}
                            <ArrowRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover/link:opacity-60 group-hover/link:translate-x-0 transition-all duration-150 flex-shrink-0" />
                          </span>
                          <span className="text-[10px] text-muted-foreground/40 font-mono truncate">
                            ID: {s.id.slice(0, 8)}…
                          </span>
                        </div>
                      </Link>
                    </td>

                    {/* Category chip */}
                    <td className="px-5 py-4">
                      {s.category ? (
                        <span className="inline-flex items-center rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-0.5 text-[11px] font-medium text-indigo-300">
                          {s.category}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/30">—</span>
                      )}
                    </td>

                    {/* Contact email */}
                    <td className="px-5 py-4">
                      {s.contact_email ? (
                        <a
                          href={`mailto:${s.contact_email}`}
                          className="flex items-center gap-1.5 text-muted-foreground hover:text-indigo-300 transition-colors text-sm"
                        >
                          <Mail className="h-3 w-3 flex-shrink-0 text-muted-foreground/40" />
                          <span className="truncate max-w-[180px]">{s.contact_email}</span>
                        </a>
                      ) : (
                        <span className="text-muted-foreground/30">—</span>
                      )}
                    </td>

                    {/* Status glass pill */}
                    <td className="px-5 py-4">
                      <span className={cn(
                        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium',
                        isActive
                          ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
                          : 'bg-zinc-500/10 border-zinc-500/20 text-zinc-400'
                      )}>
                        <span className={cn(
                          'h-1.5 w-1.5 rounded-full',
                          isActive ? 'bg-emerald-400' : 'bg-zinc-500'
                        )} />
                        {isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    {/* Contract risk roll-up badge */}
                    <td className="px-5 py-4">
                      {s.max_contract_risk === 'red' || s.max_contract_risk === 'amber' ? (
                        <span className="flex items-center gap-1.5">
                          <RiskIndicator colour={s.max_contract_risk} size="sm" data-testid={`supplier-risk-${s.max_contract_risk}`} />
                          <span className={cn(
                            'text-[11px] font-medium capitalize',
                            s.max_contract_risk === 'red' ? 'text-red-400' : 'text-amber-400'
                          )}>
                            {s.max_contract_risk}
                          </span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground/30">—</span>
                      )}
                    </td>

                    {/* Arrow */}
                    <td className="px-4 py-4 text-right">
                      <Link href={`/suppliers/${s.id}`} className="text-muted-foreground/0 group-hover:text-muted-foreground/40 transition-colors">
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
