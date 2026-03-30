import Link from 'next/link'
import { Plus, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/server'

export default async function SuppliersPage() {
  const supabase = createClient()

  // Cast needed: Supabase strict generics don't resolve select result types correctly.
  const { data: suppliers } = await (supabase.from('suppliers') as any)
    .select('id, name, category, status, contact_email')
    .order('name') as {
      data: Array<{
        id: string
        name: string
        category: string | null
        status: string
        contact_email: string | null
      }> | null
    }

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
        <Button asChild>
          <Link href="/suppliers/new">
            <Plus className="mr-2 h-4 w-4" />
            New Supplier
          </Link>
        </Button>
      </div>

      {/* Empty state */}
      {!suppliers || suppliers.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] py-16 text-center">
          <Building2 className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No suppliers yet</p>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/suppliers/new">Add your first supplier</Link>
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.03]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Category</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Contact</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {suppliers.map((s) => (
                <tr key={s.id} className="transition-colors hover:bg-white/[0.03]">
                  <td className="px-4 py-3">
                    <Link
                      href={`/suppliers/${s.id}`}
                      className="font-medium text-foreground transition-colors hover:text-indigo-400"
                    >
                      {s.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{s.category ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.contact_email ?? '—'}</td>
                  <td className="px-4 py-3">
                    <Badge
                      className={
                        s.status === 'active'
                          ? 'border-emerald-500/20 bg-emerald-500/15 text-emerald-400'
                          : 'bg-white/[0.06] text-muted-foreground'
                      }
                    >
                      {s.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
