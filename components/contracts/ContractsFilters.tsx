'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Search } from 'lucide-react'

interface ContractsFiltersProps {
  suppliers: Array<{ id: string; name: string }>
  currentSearch: string
  currentStatus: string
  currentType: string
  currentSort: string
  currentSupplierId: string
}

export function ContractsFilters({
  suppliers,
  currentSearch,
  currentStatus,
  currentType,
  currentSort,
  currentSupplierId,
}: ContractsFiltersProps) {
  const router = useRouter()
  const [searchValue, setSearchValue] = useState(currentSearch)

  function buildUrl(updates: Record<string, string>) {
    const params = new URLSearchParams()
    const values: Record<string, string> = {
      search: currentSearch,
      status: currentStatus,
      type: currentType,
      sort: currentSort,
      supplier_id: currentSupplierId,
      ...updates,
    }
    for (const [key, val] of Object.entries(values)) {
      // Omit defaults and empty values
      if (!val) continue
      if (key === 'sort' && val === 'renewal_date') continue
      params.set(key, val)
    }
    const qs = params.toString()
    return `/contracts${qs ? `?${qs}` : ''}`
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    router.push(buildUrl({ search: searchValue, page: '' }))
  }

  function handleFilterChange(key: string, value: string) {
    router.push(buildUrl({ [key]: value, page: '' }))
  }

  const selectClass =
    'h-9 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500'

  return (
    <div className="glass rounded-xl p-3 flex flex-wrap items-center gap-2 mb-4">
      <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              placeholder="Search contracts..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              aria-label="Search contracts"
              className="h-9 w-56 rounded-lg border border-white/[0.08] bg-white/[0.03] pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="h-9 rounded-lg border border-white/[0.08] bg-white/[0.06] px-3 text-sm text-foreground hover:bg-white/[0.09] transition-colors"
          >
            Search
          </button>
        </div>
      </form>

      {/* Status filter */}
      <select
        value={currentStatus}
        onChange={(e) => handleFilterChange('status', e.target.value)}
        aria-label="Status"
        className={selectClass}
      >
        <option value="">All statuses</option>
        <option value="active">Active</option>
        <option value="expiring">Expiring</option>
        <option value="expired">Expired</option>
      </select>

      {/* Type filter */}
      <select
        value={currentType}
        onChange={(e) => handleFilterChange('type', e.target.value)}
        aria-label="Contract type"
        className={selectClass}
      >
        <option value="">All types</option>
        <option value="service">Service</option>
        <option value="purchase">Purchase</option>
        <option value="lease">Lease</option>
        <option value="other">Other</option>
      </select>

      {/* Supplier filter */}
      {suppliers.length > 0 && (
        <select
          value={currentSupplierId}
          onChange={(e) => handleFilterChange('supplier_id', e.target.value)}
          aria-label="Supplier"
          className={selectClass}
        >
          <option value="">All suppliers</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      )}

      {/* Sort */}
      <select
        value={currentSort}
        onChange={(e) => handleFilterChange('sort', e.target.value)}
        aria-label="Sort by"
        className={selectClass}
      >
        <option value="renewal_date">Sort: Renewal date</option>
        <option value="value">Sort: Value</option>
        <option value="name">Sort: Name</option>
      </select>
    </div>
  )
}
