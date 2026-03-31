import Link from 'next/link'
import { Plus, FileText, ArrowRight, Calendar, DollarSign } from 'lucide-react'
import { Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { getContractStatus, getRiskColour } from '@/lib/risk'
import { RiskBadge } from '@/components/ui/RiskBadge'
import { ContractsFilters } from '@/components/contracts/ContractsFilters'
import { cn } from '@/lib/utils'

const LIMIT = 20

const TYPE_COLORS: Record<string, string> = {
  service:  'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
  purchase: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  lease:    'bg-violet-500/10 text-violet-300 border-violet-500/20',
  other:    'bg-zinc-500/10 text-zinc-300 border-zinc-500/20',
}

interface SearchParams {
  search?: string
  status?: string
  supplier_id?: string
  category?: string
  type?: string
  sort?: string
  page?: string
}

export default async function ContractsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const search       = searchParams.search ?? ''
  const statusFilter = searchParams.status ?? ''
  const supplierId   = searchParams.supplier_id ?? ''
  const category     = searchParams.category ?? ''
  const type         = searchParams.type ?? ''
  const sort         = searchParams.sort ?? 'renewal_date'
  const page         = Math.max(1, Number(searchParams.page ?? 1))

  const supabase = createClient()

  const { data: suppliers } = await (supabase.from('suppliers') as any)
    .select('id, name')
    .eq('status', 'active')
    .order('name') as { data: Array<{ id: string; name: string }> | null }

  let query = (supabase.from('contracts') as any).select('*, suppliers(id, name)')
  if (search)     query = query.ilike('name', `%${search}%`)
  if (supplierId) query = query.eq('supplier_id', supplierId)
  if (category)   query = query.eq('category', category)
  if (type)       query = query.eq('type', type)

  const sortColumn = sort === 'value' ? 'value' : sort === 'name' ? 'name' : 'renewal_date'
  query = query.order(sortColumn, { ascending: true })

  const { data: rawContracts } = await query as { data: any[] | null }
  const contracts = rawContracts ?? []

  const enriched = contracts.map((c: any) => ({
    ...c,
    status: getContractStatus(new Date(c.end_date), new Date(c.renewal_date), c.notice_period_days),
    risk_colour: getRiskColour(new Date(c.renewal_date), c.notice_period_days),
  }))

  // Status filter in app layer — never SQL (CLAUDE.md)
  const filtered     = statusFilter ? enriched.filter((c: any) => c.status === statusFilter) : enriched
  const total        = filtered.length
  const paged        = filtered.slice((page - 1) * LIMIT, page * LIMIT)
  const totalPages   = Math.ceil(total / LIMIT)

  function makePageUrl(p: number) {
    const params = new URLSearchParams()
    if (search)       params.set('search', search)
    if (statusFilter) params.set('status', statusFilter)
    if (supplierId)   params.set('supplier_id', supplierId)
    if (category)     params.set('category', category)
    if (type)         params.set('type', type)
    if (sort !== 'renewal_date') params.set('sort', sort)
    params.set('page', String(p))
    return `/contracts?${params.toString()}`
  }

  function riskStripeClass(status: string) {
    if (status === 'active')   return 'border-l-2 border-l-emerald-500/70'
    if (status === 'expiring') return 'border-l-2 border-l-amber-500/70'
    return 'border-l-2 border-l-red-500/70'
  }

  const statusLabel: Record<string, string> = {
    active: 'Active', expiring: 'Expiring', expired: 'Expired'
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold tracking-tight text-foreground text-glow">
            {statusFilter ? `${statusLabel[statusFilter] ?? statusFilter} Contracts` : 'Contracts'}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {total} contract{total !== 1 ? 's' : ''} found
            {statusFilter && (
              <Link href="/contracts" className="ml-2 text-indigo-400 hover:text-indigo-300 text-xs underline-offset-2 hover:underline">
                Clear filter ×
              </Link>
            )}
          </p>
        </div>
        <Button asChild className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white hover:brightness-110 border-0 shadow-lg shadow-indigo-500/20">
          <Link href="/contracts/new">
            <Plus className="mr-2 h-4 w-4" />
            New Contract
          </Link>
        </Button>
      </div>

      {/* Search / filter bar */}
      <Suspense>
        <ContractsFilters
          suppliers={suppliers ?? []}
          currentSearch={search}
          currentStatus={statusFilter}
          currentType={type}
          currentSort={sort}
          currentSupplierId={supplierId}
        />
      </Suspense>

      {/* Empty state — plain div (no motion — this is a Server Component) */}
      {paged.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.02] py-20 text-center backdrop-blur-xl">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border border-white/[0.08]">
            <FileText className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <p className="text-base font-medium text-foreground/60">
            {statusFilter || search ? 'No contracts match your filters' : 'No contracts yet'}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {statusFilter ? `No ${statusFilter} contracts found` : search ? `Try adjusting your search` : 'Create your first contract to get started'}
          </p>
          {!statusFilter && !search && (
            <Button asChild variant="outline" className="mt-5 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10">
              <Link href="/contracts/new">Create your first contract</Link>
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Glassmorphism table */}
          <div className="overflow-hidden rounded-2xl border border-white/[0.08] backdrop-blur-xl" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'linear-gradient(90deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.04) 50%, rgba(255,255,255,0.02) 100%)' }}
                    className="border-b border-white/[0.08]">
                  <th className="px-5 py-3.5 text-left">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/60">Name</span>
                  </th>
                  <th className="px-5 py-3.5 text-left">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/60">Supplier</span>
                  </th>
                  <th className="px-5 py-3.5 text-left">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/60">Type</span>
                  </th>
                  <th className="px-5 py-3.5 text-left">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/60">Value</span>
                  </th>
                  <th className="px-5 py-3.5 text-left">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/60">Renewal</span>
                  </th>
                  <th className="px-5 py-3.5 text-left">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/60">Status</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {paged.map((c: any, index: number) => (
                  <tr
                    key={c.id}
                    className={cn(
                      'group transition-all duration-200 animate-flicker-in',
                      'hover:bg-gradient-to-r hover:from-indigo-500/[0.06] hover:to-transparent',
                      riskStripeClass(c.status)
                    )}
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    {/* Name + contract number */}
                    <td className="px-5 py-4">
                      <Link
                        href={`/contracts/${c.id}`}
                        className="group/link flex flex-col"
                      >
                        <span className="font-semibold text-foreground transition-colors group-hover/link:text-indigo-300 flex items-center gap-1.5">
                          {c.name}
                          <ArrowRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover/link:opacity-60 group-hover/link:translate-x-0 transition-all duration-150" />
                        </span>
                        {c.contract_number && (
                          <span className="mt-0.5 font-mono text-[10px] text-muted-foreground/50">{c.contract_number}</span>
                        )}
                      </Link>
                    </td>

                    {/* Supplier */}
                    <td className="px-5 py-4">
                      {c.suppliers ? (
                        <Link
                          href={`/suppliers/${c.suppliers.id}`}
                          className="flex items-center gap-2 group/sup"
                        >
                          <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/30 to-violet-500/30 text-[9px] font-bold text-indigo-300 border border-indigo-500/20">
                            {c.suppliers.name[0]?.toUpperCase()}
                          </div>
                          <span className="text-muted-foreground transition-colors group-hover/sup:text-indigo-300 text-sm">
                            {c.suppliers.name}
                          </span>
                        </Link>
                      ) : <span className="text-muted-foreground/40">—</span>}
                    </td>

                    {/* Type chip */}
                    <td className="px-5 py-4">
                      <span className={cn(
                        'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize',
                        TYPE_COLORS[c.type] ?? TYPE_COLORS.other
                      )}>
                        {c.type}
                      </span>
                    </td>

                    {/* Value */}
                    <td className="px-5 py-4">
                      {c.value != null ? (
                        <span className="flex items-center gap-1 font-mono text-sm text-foreground/80">
                          <DollarSign className="h-3 w-3 text-emerald-400/60" />
                          {Number(c.value).toLocaleString()}
                        </span>
                      ) : <span className="text-muted-foreground/40">—</span>}
                    </td>

                    {/* Renewal date */}
                    <td className="px-5 py-4">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Calendar className="h-3 w-3 text-muted-foreground/40" />
                        <span className="text-sm">
                          {new Date(c.renewal_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </span>
                    </td>

                    {/* Status badge */}
                    <td className="px-5 py-4">
                      <RiskBadge status={c.status} risk={c.risk_colour} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}
              </span>
              <div className="flex gap-2">
                {page > 1 ? (
                  <Button asChild variant="outline" size="sm" className="border-white/[0.08] hover:border-indigo-500/30 hover:text-indigo-300">
                    <Link href={makePageUrl(page - 1)}>Previous</Link>
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" disabled>Previous</Button>
                )}
                {page < totalPages ? (
                  <Button asChild variant="outline" size="sm" className="border-white/[0.08] hover:border-indigo-500/30 hover:text-indigo-300">
                    <Link href={makePageUrl(page + 1)}>Next</Link>
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" disabled>Next</Button>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
