import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Edit2, FileDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { formatDate, formatCurrency } from '@/lib/utils'
import { getContractStatus, getRiskColour } from '@/lib/risk'
import { DeleteContractButton } from '@/components/contracts/DeleteContractButton'
import { ContractTimeline } from '@/components/contracts/ContractTimeline'
import { RiskBadge } from '@/components/ui/RiskBadge'

export default async function ContractDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()

  // Current user for role check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: profile } = await (supabase.from('profiles') as any)
    .select('role')
    .eq('id', user.id)
    .single() as { data: { role: string } | null; error: unknown }
  const isAdmin = profile?.role === 'admin'

  // Fetch contract with supplier name
  const { data: contract, error } = await (supabase.from('contracts') as any)
    .select('*, suppliers(id, name)')
    .eq('id', params.id)
    .single() as {
      data: {
        id: string
        contract_number: string
        name: string
        type: string
        category: string | null
        start_date: string
        end_date: string
        renewal_date: string
        notice_period_days: number
        value: number | null
        pdf_url: string | null
        suppliers: { id: string; name: string } | null
      } | null
      error: unknown
    }

  if (error || !contract) notFound()

  // Generate signed URL for PDF (15-min expiry)
  let signedUrl: string | null = null
  if (contract.pdf_url) {
    const { data: urlData } = await supabase.storage
      .from('contract-pdfs')
      .createSignedUrl(contract.pdf_url, 900)
    signedUrl = urlData?.signedUrl ?? null
  }

  const status = getContractStatus(
    new Date(contract.end_date),
    new Date(contract.renewal_date),
    contract.notice_period_days
  )
  const riskColour = getRiskColour(
    new Date(contract.renewal_date),
    contract.notice_period_days
  )

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
        <Link href="/contracts">
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to Contracts
        </Link>
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold tracking-tight text-foreground text-glow">
            {contract.name}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {contract.contract_number}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RiskBadge status={status} risk={riskColour} />
          <Button asChild variant="outline" size="sm">
            <Link href={`/contracts/${contract.id}/edit`}>
              <Edit2 className="mr-1.5 h-3.5 w-3.5" />
              Edit
            </Link>
          </Button>
          {isAdmin && <DeleteContractButton contractId={contract.id} />}
        </div>
      </div>

      {/* Timeline */}
      <ContractTimeline
        startDate={contract.start_date}
        endDate={contract.end_date}
        renewalDate={contract.renewal_date}
        riskColour={riskColour}
      />

      {/* Contract details */}
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-5">
        <h3 className="mb-4 text-sm font-semibold text-foreground">Contract Details</h3>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3">
            <dt className="text-[10px] uppercase tracking-widest text-muted-foreground/60 mb-1">Supplier</dt>
            <dd className="text-sm font-medium text-foreground">
              {contract.suppliers ? (
                <Link
                  href={`/suppliers/${contract.suppliers.id}`}
                  className="transition-colors hover:text-indigo-400"
                >
                  {contract.suppliers.name}
                </Link>
              ) : (
                '—'
              )}
            </dd>
          </div>
          <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3">
            <dt className="text-[10px] uppercase tracking-widest text-muted-foreground/60 mb-1">Type</dt>
            <dd className="text-sm font-medium text-foreground capitalize">{contract.type}</dd>
          </div>
          <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3">
            <dt className="text-[10px] uppercase tracking-widest text-muted-foreground/60 mb-1">Category</dt>
            <dd className="text-sm font-medium text-foreground">{contract.category ?? '—'}</dd>
          </div>
          <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3">
            <dt className="text-[10px] uppercase tracking-widest text-muted-foreground/60 mb-1">Start Date</dt>
            <dd className="text-sm font-medium text-foreground">{formatDate(contract.start_date)}</dd>
          </div>
          <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3">
            <dt className="text-[10px] uppercase tracking-widest text-muted-foreground/60 mb-1">End Date</dt>
            <dd className="text-sm font-medium text-foreground">{formatDate(contract.end_date)}</dd>
          </div>
          <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3">
            <dt className="text-[10px] uppercase tracking-widest text-muted-foreground/60 mb-1">Renewal Date</dt>
            <dd className="text-sm font-medium text-foreground">{formatDate(contract.renewal_date)}</dd>
          </div>
          <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3">
            <dt className="text-[10px] uppercase tracking-widest text-muted-foreground/60 mb-1">Notice Period</dt>
            <dd className="text-sm font-medium text-foreground">{contract.notice_period_days} days</dd>
          </div>
          <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3">
            <dt className="text-[10px] uppercase tracking-widest text-muted-foreground/60 mb-1">Contract Value</dt>
            <dd className="text-sm font-medium text-foreground">{formatCurrency(contract.value)}</dd>
          </div>
        </dl>
      </div>

      {/* PDF section */}
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-5">
        <h3 className="mb-4 text-sm font-semibold text-foreground">Contract Document</h3>
        {signedUrl ? (
          <Button asChild variant="outline" size="sm">
            <a href={signedUrl} target="_blank" rel="noopener noreferrer">
              <FileDown className="mr-1.5 h-3.5 w-3.5" />
              Download PDF
            </a>
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">No PDF attached</p>
        )}
      </div>
    </div>
  )
}
