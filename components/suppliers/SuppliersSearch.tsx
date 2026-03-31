'use client'

import { Search } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'

export function SuppliersSearch() {
  const router = useRouter()
  const params = useSearchParams()
  const [isPending, startTransition] = useTransition()

  function handleSearch(term: string) {
    const p = new URLSearchParams(params.toString())
    if (term) p.set('search', term)
    else p.delete('search')
    startTransition(() => router.push(`/suppliers?${p.toString()}`))
  }

  return (
    <div className="relative w-64">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <input
        type="search"
        placeholder="Search suppliers..."
        defaultValue={params.get('search') ?? ''}
        onChange={(e) => handleSearch(e.target.value)}
        className="h-9 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/40"
      />
    </div>
  )
}
