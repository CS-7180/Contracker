'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Supplier = {
  id: string
  name: string
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  category: string | null
}

export default function SupplierEditForm({ supplier }: { supplier: Supplier }) {
  const router = useRouter()
  const [form, setForm] = useState({
    name: supplier.name,
    contact_name: supplier.contact_name ?? '',
    contact_email: supplier.contact_email ?? '',
    contact_phone: supplier.contact_phone ?? '',
    category: supplier.category ?? '',
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch(`/api/suppliers/${supplier.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const body = await res.json()
    if (!res.ok) {
      setError(body.error?.message ?? 'Failed to update supplier')
      setLoading(false)
      return
    }

    router.push(`/suppliers/${supplier.id}`)
  }

  function field(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }))
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
        <Link href={`/suppliers/${supplier.id}`}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to Supplier
        </Link>
      </Button>

      <div>
        <h2 className="text-2xl font-display font-bold tracking-tight text-foreground text-glow">
          Edit Supplier
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{supplier.name}</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-xl border border-white/[0.08] bg-white/[0.03] p-6"
      >
        <div className="space-y-2">
          <Label htmlFor="name">Company Name *</Label>
          <Input
            id="name"
            value={form.name}
            onChange={field('name')}
            placeholder="Acme Corporation"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="contact_name">Contact Name</Label>
            <Input
              id="contact_name"
              value={form.contact_name}
              onChange={field('contact_name')}
              placeholder="Jane Smith"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact_email">Contact Email</Label>
            <Input
              id="contact_email"
              type="email"
              value={form.contact_email}
              onChange={field('contact_email')}
              placeholder="jane@acme.com"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="contact_phone">Contact Phone</Label>
            <Input
              id="contact_phone"
              value={form.contact_phone}
              onChange={field('contact_phone')}
              placeholder="+1 555 000 0000"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              value={form.category}
              onChange={field('category')}
              placeholder="Technology"
            />
          </div>
        </div>

        {error && (
          <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button asChild variant="outline" type="button">
            <Link href={`/suppliers/${supplier.id}`}>Cancel</Link>
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  )
}
