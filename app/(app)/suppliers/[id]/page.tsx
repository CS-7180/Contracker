import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Edit2, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/server'
import { formatDate, formatCurrency } from '@/lib/utils'
import { getContractStatus, getRiskColour } from '@/lib/risk'

const RISK_BADGE: Record<string, string> = {
  green: 'border-emerald-500/20 bg-emerald-500/15 text-emerald-400',
  amber: 'border-amber-500/20 bg-amber-500/15 text-amber-400',
  red: 'border-red-500/20 bg-red-500/15 text-red-400',
}

export default async function SupplierDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()

  // Cast needed: Supabase strict generics don't resolve relational select types correctly.
  const { data: supplier, error } = await (supabase.from('suppliers') as any)
    .select('*, contracts(*)')
    .eq('id', params.id)
    .single() as {
      data: {
        id: string
        name: string
        category: string | null
        status: string
        contact_name: string | null
        contact_email: string | null
        contact_phone: string | null
        contracts: any[]
      } | null
      error: unknown
    }

  if (error || !supplier) notFound()

  const contracts = supplier.contracts ?? []

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
        <Link href="/suppliers">
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to Suppliers
        </Link>
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold tracking-tight text-foreground text-glow">
            {supplier.name}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {supplier.category ?? 'No category'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            className={
              supplier.status === 'active'
                ? 'border-emerald-500/20 bg-emerald-500/15 text-emerald-400'
                : 'bg-white/[0.06] text-muted-foreground'
            }
          >
            {supplier.status}
          </Badge>
          <Button asChild variant="outline" size="sm">
            <Link href={`/suppliers/${supplier.id}/edit`}>
              <Edit2 className="mr-1.5 h-3.5 w-3.5" />
              Edit
            </Link>
          </Button>
        </div>
      </div>

      {/* Contact info */}
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-5">
        <h3 className="mb-4 text-sm font-semibold text-foreground">Contact Information</h3>
        <dl className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <dt className="text-muted-foreground">Contact Name</dt>
            <dd className="mt-1 text-foreground">{supplier.contact_name ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Email</dt>
            <dd className="mt-1 text-foreground">{supplier.contact_email ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Phone</dt>
            <dd className="mt-1 text-foreground">{supplier.contact_phone ?? '—'}</dd>
          </div>
        </dl>
      </div>

      {/* Linked contracts (AC-02-4) */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">
          Contracts ({contracts.length})
        </h3>

        {contracts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] py-10 text-center">
            <FileText className="mb-3 h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              No contracts linked to this supplier
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.03]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Renewal Date
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Value
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {contracts.map((c) => {
                  const status = getContractStatus(
                    new Date(c.end_date),
                    new Date(c.renewal_date),
                    c.notice_period_days
                  )
                  const risk = getRiskColour(
                    new Date(c.renewal_date),
                    c.notice_period_days
                  )
                  return (
                    <tr key={c.id} className="transition-colors hover:bg-white/[0.03]">
                      <td className="px-4 py-3">
                        <Link
                          href={`/contracts/${c.id}`}
                          className="font-medium text-foreground transition-colors hover:text-indigo-400"
                        >
                          {c.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 capitalize text-muted-foreground">
                        {c.type}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(c.renewal_date)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatCurrency(c.value)}
                      </td>
                      <td className="px-4 py-3">
                        {/* Text label alongside colour badge — accessibility */}
                        <Badge className={RISK_BADGE[risk]}>{status}</Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
