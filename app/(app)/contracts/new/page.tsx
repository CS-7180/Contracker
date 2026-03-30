'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
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
import type { Supplier } from '@/types/database'

export default function NewContractPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    contract_number: '',
    name: '',
    type: 'service',
    supplier_id: '',
    category: '',
    start_date: '',
    end_date: '',
    renewal_date: '',
    notice_period_days: '30',
    value: '',
  })
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [pdfError, setPdfError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/suppliers')
      .then((r) => r.json())
      .then((body) => {
        if (body.data) setSuppliers(body.data)
      })
      .catch(() => {/* silently ignore — supplier dropdown will be empty */})
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    // Client-side validation
    if (!form.start_date || !form.end_date || !form.renewal_date) {
      setError('Please fill in all date fields with a valid date (YYYY-MM-DD)')
      return
    }
    if (form.end_date < form.start_date) {
      setError('End date must be on or after start date')
      return
    }
    if (form.renewal_date > form.end_date) {
      setError('Renewal date must be on or before end date')
      return
    }
    if (!form.supplier_id) {
      setError('Please select a supplier')
      return
    }

    setLoading(true)

    const res = await fetch('/api/contracts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        notice_period_days: Number(form.notice_period_days) || 30,
        value: form.value ? Number(form.value) : undefined,
      }),
    })

    const body = await res.json()
    if (!res.ok) {
      setError(body.error?.message ?? 'Failed to create contract')
      setLoading(false)
      return
    }

    const contractId = body.data.id

    if (pdfFile) {
      const fd = new FormData()
      fd.append('pdf', pdfFile)
      const uploadRes = await fetch(`/api/contracts/${contractId}/upload`, {
        method: 'POST',
        body: fd,
      })
      if (!uploadRes.ok) {
        const uploadBody = await uploadRes.json()
        setPdfError(uploadBody.error?.message ?? 'PDF upload failed — contract saved without PDF')
      }
    }

    router.push(`/contracts/${contractId}`)
  }

  function handlePdfChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPdfError(null)
    const file = e.target.files?.[0] ?? null
    if (!file) {
      setPdfFile(null)
      return
    }
    if (file.type !== 'application/pdf') {
      setPdfError('Only PDF files are accepted')
      e.target.value = ''
      setPdfFile(null)
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setPdfError('File exceeds the 10 MB size limit')
      e.target.value = ''
      setPdfFile(null)
      return
    }
    setPdfFile(file)
  }

  function field(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }))
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
        <Link href="/contracts">
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to Contracts
        </Link>
      </Button>

      <div>
        <h2 className="text-2xl font-display font-bold tracking-tight text-foreground text-glow">
          New Contract
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Add a new contract to your portfolio
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-xl border border-white/[0.08] bg-white/[0.03] p-6"
      >
        {/* Contract Number */}
        <div className="space-y-2">
          <Label htmlFor="contract_number">Contract Number</Label>
          <Input
            id="contract_number"
            value={form.contract_number}
            onChange={field('contract_number')}
            placeholder="Auto-generated if blank"
          />
        </div>

        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Contract Name *</Label>
          <Input
            id="name"
            value={form.name}
            onChange={field('name')}
            placeholder="e.g. Annual Support Agreement"
            required
          />
        </div>

        {/* Type + Supplier */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="type">Contract Type *</Label>
            <Select
              value={form.type}
              onValueChange={(v) => setForm((prev) => ({ ...prev, type: v }))}
              name="type"
            >
              <SelectTrigger id="type" aria-label="Contract Type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="service">Service</SelectItem>
                <SelectItem value="purchase">Purchase</SelectItem>
                <SelectItem value="lease">Lease</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplier_id">Supplier *</Label>
            <Select
              value={form.supplier_id}
              onValueChange={(v) => setForm((prev) => ({ ...prev, supplier_id: v }))}
              name="supplier_id"
            >
              <SelectTrigger id="supplier_id" aria-label="Supplier">
                <SelectValue placeholder="Select supplier" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start_date">Start Date *</Label>
            <Input
              id="start_date"
              type="date"
              value={form.start_date}
              onChange={field('start_date')}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end_date">End Date *</Label>
            <Input
              id="end_date"
              type="date"
              value={form.end_date}
              onChange={field('end_date')}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="renewal_date">Renewal Date *</Label>
            <Input
              id="renewal_date"
              type="date"
              value={form.renewal_date}
              onChange={field('renewal_date')}
              required
            />
          </div>
        </div>

        {/* Notice Period + Value */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="notice_period_days">Notice Period (days)</Label>
            <Input
              id="notice_period_days"
              type="number"
              min="1"
              value={form.notice_period_days}
              onChange={field('notice_period_days')}
              placeholder="30"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="value">Contract Value ($)</Label>
            <Input
              id="value"
              type="number"
              min="0"
              step="0.01"
              value={form.value}
              onChange={field('value')}
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            value={form.category}
            onChange={field('category')}
            placeholder="e.g. Technology, Facilities"
          />
        </div>

        {/* PDF Upload */}
        <div className="space-y-2">
          <Label htmlFor="pdf">Contract PDF <span className="text-muted-foreground">(optional, PDF only, max 10 MB)</span></Label>
          <Input
            id="pdf"
            type="file"
            accept=".pdf,application/pdf"
            onChange={handlePdfChange}
            className="cursor-pointer file:mr-3 file:cursor-pointer file:rounded file:border-0 file:bg-primary/10 file:px-3 file:py-1 file:text-sm file:font-medium"
          />
          {pdfError && (
            <p className="text-sm text-red-400">{pdfError}</p>
          )}
        </div>

        {error && (
          <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button asChild variant="outline" type="button">
            <Link href="/contracts">Cancel</Link>
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating…' : 'Create Contract'}
          </Button>
        </div>
      </form>
    </div>
  )
}
