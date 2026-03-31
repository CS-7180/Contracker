import Link from 'next/link'
import { Plus, FileText } from 'lucide-react'
import { Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/server'
import { getContractStatus, getRiskColour } from '@/lib/risk'
import { ContractsFilters } from '@/components/contracts/ContractsFilters'

const LIMIT = 20

interface SearchParams {
  search?: string
  status?: string
  supplier_id?: string
  category?: string
  type?: string
  sort?: string
  page?: string
}

function statusBadgeClass(status: string) {
  if (status === 'active')   return 'border-emerald-500/20 bg-emerald-500/15 text-emerald-400'
  if (status === 'expiring') return 'border-amber-500/20 bg-amber-500/15 text-amber-400'
  return 'border-red-500/20 bg-red-500/15 text-red-400'
}

export default async function ContractsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const search     = searchParams.search ?? ''
  const statusFilter = searchParams.status ?? ''
  const supplierId = searchParams.supplier_id ?? ''
  const category   = searchParams.category ?? ''
  const type       = searchParams.type ?? ''
  const sort       = searchParams.sort ?? 'renewal_date'
  const page       = Math.max(1, Number(searchParams.page ?? 1))

  const supabase = createClient()

  // Fetch active suppliers for the filter dropdown
  const { data: suppliers } = await (supabase.from('suppliers') as any)
    .select('id, name')
    .eq('status', 'active')
    .order('name') as { data: Array<{ id: string; name: string }> | null }

  // Build Supabase query with SQL-safe filters
  let query = (supabase.from('contracts') as any).select('*, suppliers(id, name)')
  if (search)      query = query.ilike('name', `%${search}%`)
  if (supplierId)  query = query.eq('supplier_id', supplierId)
  if (category)    query = query.eq('category', category)
  if (type)        query = query.eq('type', type)

  const sortColumn = sort === 'value' ? 'value' : sort === 'name' ? 'name' : 'renewal_date'
  query = query.order(sortColumn, { ascending: true })

  const { data: rawContracts } = await query as { data: any[] | null }
  const contracts = rawContracts ?? []

  // Enrich with computed status + risk_colour (never stored in DB)
  const enriched = contracts.map((c: any) => ({
    ...c,
    status: getContractStatus(new Date(c.end_date), new Date(c.renewal_date), c.notice_period_days),
    risk_colour: getRiskColour(new Date(c.renewal_date), c.notice_period_days),
  }))

  // Status filter must happen in app layer — never SQL (CLAUDE.md)
  const filtered = statusFilter ? enriched.filter((c: any) => c.status === statusFilter) : enriched
  const total = filtered.length
  const paged = filtered.slice((page - 1) * LIMIT, page * LIMIT)
  const totalPages = Math.ceil(total / LIMIT)

  function makePageUrl(p: number) {
    const params = new URLSearchParams()
    if (search)      params.set('search', search)
    if (statusFilter) params.set('status', statusFilter)
    if (supplierId)  params.set('supplier_id', supplierId)
    if (category)    params.set('category', category)
    if (type)        params.set('type', type)
    if (sort !== 'renewal_date') params.set('sort', sort)
    params.set('page', String(p))
    return `/contracts?${params.toString()}`
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold tracking-tight text-foreground text-glow">
            Contracts
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {total} contract{total !== 1 ? 's' : ''} found
          </p>
        </div>
        <Button asChild>
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

      {/* Empty state */}
      {paged.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] py-16 text-center">
          <FileText className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            {statusFilter || search ? 'No contracts match your filters' : 'No contracts yet'}
          </p>
          {!statusFilter && !search && (
            <Button asChild variant="outline" className="mt-4">
              <Link href="/contracts/new">Create your first contract</Link>
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Contracts table */}
          <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.03]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Supplier</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Value</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Renewal Date</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {paged.map((c: any) => (
                  <tr key={c.id} className="transition-colors hover:bg-white/[0.03]">
                    <td className="px-4 py-3">
                      <Link
                        href={`/contracts/${c.id}`}
                        className="font-medium text-foreground transition-colors hover:text-indigo-400"
                      >
                        {c.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {c.suppliers ? (
                        <Link
                          href={`/suppliers/${c.suppliers.id}`}
                          className="transition-colors hover:text-indigo-400"
                        >
                          {c.suppliers.name}
                        </Link>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 capitalize text-muted-foreground">{c.type}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {c.value != null ? `$${Number(c.value).toLocaleString()}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{c.renewal_date}</td>
                    <td className="px-4 py-3">
                      <Badge className={statusBadgeClass(c.status)}>{c.status}</Badge>
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
                  <Button asChild variant="outline" size="sm">
                    <Link href={makePageUrl(page - 1)}>Previous</Link>
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" disabled>Previous</Button>
                )}
                {page < totalPages ? (
                  <Button asChild variant="outline" size="sm">
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
