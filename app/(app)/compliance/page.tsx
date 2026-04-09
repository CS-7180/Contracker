import Link from 'next/link'
import { ShieldCheck, ShieldAlert, ShieldX, ArrowRight, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getCertificationStatus } from '@/lib/risk'
import { cn } from '@/lib/utils'

type CertStatus = 'valid' | 'expiring' | 'expired'
type ComplianceLevel = 'green' | 'amber' | 'red' | 'none'

interface CertRow {
  id: string
  cert_type: string
  expiry_date: string
  status: CertStatus
}

interface SupplierRow {
  id: string
  name: string
  category: string | null
  certifications: CertRow[]
  complianceLevel: ComplianceLevel
  validCount: number
  expiringCount: number
  expiredCount: number
}

function getComplianceLevel(certs: CertRow[]): ComplianceLevel {
  if (certs.length === 0) return 'none'
  if (certs.some(c => c.status === 'expired')) return 'red'
  if (certs.some(c => c.status === 'expiring')) return 'amber'
  return 'green'
}

const LEVEL_CONFIG: Record<ComplianceLevel, {
  label: string
  dot: string
  badge: string
  icon: React.ElementType
}> = {
  green: {
    label: 'Compliant',
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    icon: ShieldCheck,
  },
  amber: {
    label: 'Expiring',
    dot: 'bg-amber-500',
    badge: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    icon: ShieldAlert,
  },
  red: {
    label: 'Non-compliant',
    dot: 'bg-red-500',
    badge: 'bg-red-500/15 text-red-400 border-red-500/20',
    icon: ShieldX,
  },
  none: {
    label: 'No certs',
    dot: 'bg-zinc-500',
    badge: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20',
    icon: ShieldCheck,
  },
}

const CERT_TYPE_LABELS: Record<string, string> = {
  ISO: 'ISO',
  NDA: 'NDA',
  insurance: 'Insurance',
  other: 'Other',
}

export default async function CompliancePage() {
  const supabase = createClient()

  const { data: rawSuppliers } = await (supabase
    .from('suppliers') as any)
    .select(`
      id, name, category,
      certifications(id, cert_type, expiry_date)
    `)
    .eq('status', 'active')
    .order('name') as {
    data: Array<{
      id: string
      name: string
      category: string | null
      certifications: Array<{ id: string; cert_type: string; expiry_date: string }>
    }> | null
  }

  const today = new Date()

  const suppliers: SupplierRow[] = (rawSuppliers ?? []).map(s => {
    const certsWithStatus: CertRow[] = (s.certifications ?? []).map(c => ({
      ...c,
      status: getCertificationStatus(new Date(c.expiry_date), today),
    }))
    const validCount = certsWithStatus.filter(c => c.status === 'valid').length
    const expiringCount = certsWithStatus.filter(c => c.status === 'expiring').length
    const expiredCount = certsWithStatus.filter(c => c.status === 'expired').length
    return {
      id: s.id,
      name: s.name,
      category: s.category,
      certifications: certsWithStatus,
      complianceLevel: getComplianceLevel(certsWithStatus),
      validCount,
      expiringCount,
      expiredCount,
    }
  })

  // Sort: non-compliant first, then expiring, then compliant, then none
  const ORDER: Record<ComplianceLevel, number> = { red: 0, amber: 1, green: 2, none: 3 }
  suppliers.sort((a, b) => ORDER[a.complianceLevel] - ORDER[b.complianceLevel])

  const totalRed = suppliers.filter(s => s.complianceLevel === 'red').length
  const totalAmber = suppliers.filter(s => s.complianceLevel === 'amber').length
  const totalGreen = suppliers.filter(s => s.complianceLevel === 'green').length
  const totalNone = suppliers.filter(s => s.complianceLevel === 'none').length

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold tracking-tight text-foreground text-glow">
            Compliance Center
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Supplier certification status across your portfolio
          </p>
        </div>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { level: 'red' as ComplianceLevel, count: totalRed, label: 'Non-compliant' },
          { level: 'amber' as ComplianceLevel, count: totalAmber, label: 'Expiring' },
          { level: 'green' as ComplianceLevel, count: totalGreen, label: 'Compliant' },
          { level: 'none' as ComplianceLevel, count: totalNone, label: 'No certs' },
        ].map(({ level, count, label }) => {
          const cfg = LEVEL_CONFIG[level]
          return (
            <div
              key={level}
              className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3"
            >
              <span className={cn('h-3 w-3 rounded-full flex-shrink-0', cfg.dot)} />
              <div>
                <p className="text-xl font-bold text-foreground">{count}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Supplier compliance table */}
      {suppliers.length === 0 ? (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] py-16 text-center">
          <ShieldCheck className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">No active suppliers found.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Supplier</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Category</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Certifications</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground"></th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((supplier, i) => {
                const cfg = LEVEL_CONFIG[supplier.complianceLevel]
                const Icon = cfg.icon
                return (
                  <tr
                    key={supplier.id}
                    className={cn(
                      'border-b border-white/[0.04] transition-colors hover:bg-white/[0.03]',
                      i === suppliers.length - 1 && 'border-b-0',
                    )}
                  >
                    {/* Supplier name */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <span className={cn('h-2 w-2 rounded-full flex-shrink-0', cfg.dot)} />
                        <span className="font-medium text-foreground">{supplier.name}</span>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3.5 text-muted-foreground">
                      {supplier.category ?? '—'}
                    </td>

                    {/* Compliance status badge */}
                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
                          cfg.badge,
                        )}
                      >
                        <Icon className="h-3 w-3" />
                        {cfg.label}
                      </span>
                    </td>

                    {/* Cert type chips */}
                    <td className="px-4 py-3.5">
                      {supplier.certifications.length === 0 ? (
                        <span className="text-xs text-muted-foreground/60 italic">None added</span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {supplier.certifications.map(cert => {
                            const statusColour =
                              cert.status === 'expired' ? 'bg-red-500/15 text-red-400 border-red-500/20' :
                              cert.status === 'expiring' ? 'bg-amber-500/15 text-amber-400 border-amber-500/20' :
                              'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
                            return (
                              <span
                                key={cert.id}
                                className={cn(
                                  'rounded-full border px-2 py-0.5 text-[11px] font-medium',
                                  statusColour,
                                )}
                                title={`Expires ${cert.expiry_date}`}
                              >
                                {CERT_TYPE_LABELS[cert.cert_type] ?? cert.cert_type}
                              </span>
                            )
                          })}
                        </div>
                      )}
                    </td>

                    {/* Link to supplier profile */}
                    <td className="px-4 py-3.5 text-right">
                      <Link
                        href={`/suppliers/${supplier.id}`}
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Manage
                        <ArrowRight className="h-3 w-3" />
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
