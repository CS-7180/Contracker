'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'

const CERT_TYPES = [
  { value: 'ISO', label: 'ISO' },
  { value: 'NDA', label: 'NDA' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'other', label: 'Other' },
]

export default function NewCertificationPage() {
  const params = useParams<{ id: string }>()
  const supplierId = params.id
  const router = useRouter()
  const { toast } = useToast()

  const [form, setForm] = useState({
    cert_type: 'ISO',
    issued_date: '',
    expiry_date: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!form.expiry_date) {
      setError('Expiry date is required.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/certifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplier_id: supplierId,
          cert_type: form.cert_type,
          issued_date: form.issued_date || undefined,
          expiry_date: form.expiry_date,
        }),
      })

      const body = await res.json()
      if (!res.ok) {
        setError(body.error?.message ?? 'Something went wrong.')
        return
      }

      toast({ title: 'Certification added' })
      router.push(`/suppliers/${supplierId}`)
    } catch {
      setError('Network error — please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
        <Link href={`/suppliers/${supplierId}`}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to Supplier
        </Link>
      </Button>

      <div>
        <h2 className="text-2xl font-display font-bold tracking-tight text-foreground text-glow">
          Add Certification
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Attach a compliance certificate to this supplier.
        </p>
      </div>

      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="space-y-5 rounded-xl border border-white/[0.08] bg-white/[0.03] p-6"
      >
        {/* Cert type */}
        <div className="space-y-1.5">
          <Label htmlFor="cert_type">Certification Type</Label>
          <Select value={form.cert_type} onValueChange={v => set('cert_type', v)}>
            <SelectTrigger id="cert_type">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {CERT_TYPES.map(t => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Issued date (optional) */}
        <div className="space-y-1.5">
          <Label htmlFor="issued_date">
            Issue Date <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="issued_date"
            type="date"
            value={form.issued_date}
            onChange={e => set('issued_date', e.target.value)}
          />
        </div>

        {/* Expiry date (required) */}
        <div className="space-y-1.5">
          <Label htmlFor="expiry_date">
            Expiry Date <span className="text-red-400">*</span>
          </Label>
          <Input
            id="expiry_date"
            type="date"
            required
            value={form.expiry_date}
            onChange={e => set('expiry_date', e.target.value)}
          />
        </div>

        {error && (
          <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {error}
          </p>
        )}

        <div className="flex items-center gap-3 pt-1">
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              'Add Certification'
            )}
          </Button>
          <Button asChild variant="outline">
            <Link href={`/suppliers/${supplierId}`}>Cancel</Link>
          </Button>
        </div>
      </motion.form>
    </div>
  )
}
