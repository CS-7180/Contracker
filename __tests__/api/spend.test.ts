/**
 * SPEND API TESTS — Issues #28, #29 [M3.1]
 *
 * TDD RED  🔴 — these tests FAIL until GET /api/spend is implemented.
 * TDD GREEN 🟢 — tests pass after route is implemented.
 *
 * AC-09-1: Contracts with known values across suppliers → correct summed value
 * AC-09-2: Category filter → only that category included in totals
 * AC-09-3: Current year filter → only contracts with start_date in current year
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the server Supabase factory — prevents next/headers from being called
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'
import { GET } from '@/app/api/spend/route'

const mockCreateClient = vi.mocked(createClient)

// ─── Date helpers ─────────────────────────────────────────────────────────────

const CURRENT_YEAR = new Date().getFullYear()

function isoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function addDays(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

// ─── Chainable query builder mock ─────────────────────────────────────────────

/** Creates a mock Supabase query builder that is awaitable at any chain depth. */
function makeQb(result: { data: unknown; error: unknown }) {
  const qb: any = {}
  for (const m of ['select', 'gte', 'lte', 'eq']) {
    qb[m] = vi.fn().mockReturnValue(qb)
  }
  // Make thenable so `await qb` (or any chain) resolves to result
  qb.then = (resolve: (v: unknown) => unknown) =>
    Promise.resolve(result).then(resolve)
  return qb
}

function authClient(userId: string | null) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: userId ? { id: userId } : null },
        error: null,
      }),
    },
  }
}

// ─── Shared mock contracts ─────────────────────────────────────────────────────

const acmeTechContract = {
  id: 'c-1',
  supplier_id: 'sup-1',
  suppliers: { name: 'Acme Corp' },
  value: 50000,
  category: 'Technology',
  start_date: isoDate(CURRENT_YEAR, 1, 15),
  end_date: addDays(365),
}

const acmeTechContract2 = {
  id: 'c-2',
  supplier_id: 'sup-1',
  suppliers: { name: 'Acme Corp' },
  value: 20000,
  category: 'Technology',
  start_date: isoDate(CURRENT_YEAR, 3, 10),
  end_date: addDays(300),
}

const betaServicesContract = {
  id: 'c-3',
  supplier_id: 'sup-2',
  suppliers: { name: 'Beta Services' },
  value: 30000,
  category: 'Consulting',
  start_date: isoDate(CURRENT_YEAR, 2, 1),
  end_date: addDays(200),
}

const expiredContract = {
  id: 'c-4',
  supplier_id: 'sup-3',
  suppliers: { name: 'Old Corp' },
  value: 100000,
  category: 'Technology',
  start_date: isoDate(CURRENT_YEAR - 1, 1, 1),
  end_date: addDays(-10), // expired 10 days ago
}

const prevYearContract = {
  id: 'c-5',
  supplier_id: 'sup-2',
  suppliers: { name: 'Beta Services' },
  value: 15000,
  category: 'Consulting',
  start_date: isoDate(CURRENT_YEAR - 1, 6, 1),
  end_date: addDays(100),
}

// ─── GET /api/spend — unauthenticated ─────────────────────────────────────────

describe('GET /api/spend — unauthenticated', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    const qb = makeQb({ data: [], error: null })
    mockCreateClient.mockReturnValue({ ...authClient(null), from: vi.fn().mockReturnValue(qb) } as any)

    const res = await GET(new Request('http://localhost/api/spend'))
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.data).toBeNull()
    expect(body.error.code).toBe('401')
  })
})

// ─── GET /api/spend — period=all (default) ────────────────────────────────────

describe('GET /api/spend — period=all (AC-09-1)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('sums spend by supplier correctly', async () => {
    const qb = makeQb({ data: [acmeTechContract, acmeTechContract2, betaServicesContract], error: null })
    mockCreateClient.mockReturnValue({ ...authClient('user-1'), from: vi.fn().mockReturnValue(qb) } as any)

    const res = await GET(new Request('http://localhost/api/spend'))
    expect(res.status).toBe(200)
    const body = await res.json()

    const acme = body.data.bySupplier.find((s: any) => s.supplier_name === 'Acme Corp')
    const beta = body.data.bySupplier.find((s: any) => s.supplier_name === 'Beta Services')

    expect(acme).toBeDefined()
    expect(acme.total).toBe(70000) // 50000 + 20000
    expect(beta).toBeDefined()
    expect(beta.total).toBe(30000)
  })

  it('sums spend by category correctly', async () => {
    const qb = makeQb({ data: [acmeTechContract, acmeTechContract2, betaServicesContract], error: null })
    mockCreateClient.mockReturnValue({ ...authClient('user-1'), from: vi.fn().mockReturnValue(qb) } as any)

    const res = await GET(new Request('http://localhost/api/spend'))
    const body = await res.json()

    const tech = body.data.byCategory.find((c: any) => c.category === 'Technology')
    const consulting = body.data.byCategory.find((c: any) => c.category === 'Consulting')

    expect(tech).toBeDefined()
    expect(tech.total).toBe(70000) // 50000 + 20000
    expect(consulting).toBeDefined()
    expect(consulting.total).toBe(30000)
  })

  it('returns bySupplier sorted descending by total', async () => {
    const qb = makeQb({ data: [betaServicesContract, acmeTechContract, acmeTechContract2], error: null })
    mockCreateClient.mockReturnValue({ ...authClient('user-1'), from: vi.fn().mockReturnValue(qb) } as any)

    const res = await GET(new Request('http://localhost/api/spend'))
    const body = await res.json()

    const totals = body.data.bySupplier.map((s: any) => s.total)
    expect(totals[0]).toBeGreaterThanOrEqual(totals[1])
  })

  it('excludes expired contracts from spend totals', async () => {
    const qb = makeQb({ data: [acmeTechContract, expiredContract], error: null })
    mockCreateClient.mockReturnValue({ ...authClient('user-1'), from: vi.fn().mockReturnValue(qb) } as any)

    const res = await GET(new Request('http://localhost/api/spend'))
    const body = await res.json()

    const acme = body.data.bySupplier.find((s: any) => s.supplier_name === 'Acme Corp')
    const oldCorp = body.data.bySupplier.find((s: any) => s.supplier_name === 'Old Corp')

    expect(acme.total).toBe(50000)
    expect(oldCorp).toBeUndefined() // expired — excluded
  })

  it('returns { data: { bySupplier, byCategory }, error: null } shape', async () => {
    const qb = makeQb({ data: [acmeTechContract], error: null })
    mockCreateClient.mockReturnValue({ ...authClient('user-1'), from: vi.fn().mockReturnValue(qb) } as any)

    const res = await GET(new Request('http://localhost/api/spend'))
    const body = await res.json()

    expect(body).toHaveProperty('data')
    expect(body.data).toHaveProperty('bySupplier')
    expect(body.data).toHaveProperty('byCategory')
    expect(body.error).toBeNull()
  })

  it('returns empty arrays when no contracts exist', async () => {
    const qb = makeQb({ data: [], error: null })
    mockCreateClient.mockReturnValue({ ...authClient('user-1'), from: vi.fn().mockReturnValue(qb) } as any)

    const res = await GET(new Request('http://localhost/api/spend'))
    const body = await res.json()

    expect(body.data.bySupplier).toEqual([])
    expect(body.data.byCategory).toEqual([])
  })

  it('handles contracts with null value gracefully (excludes from totals)', async () => {
    const contractNoValue = { ...acmeTechContract, id: 'c-nv', value: null }
    const qb = makeQb({ data: [acmeTechContract, contractNoValue], error: null })
    mockCreateClient.mockReturnValue({ ...authClient('user-1'), from: vi.fn().mockReturnValue(qb) } as any)

    const res = await GET(new Request('http://localhost/api/spend'))
    const body = await res.json()

    const acme = body.data.bySupplier.find((s: any) => s.supplier_name === 'Acme Corp')
    expect(acme.total).toBe(50000) // only the valued contract counted
  })
})

// ─── GET /api/spend — period=year (AC-09-3) ───────────────────────────────────

describe('GET /api/spend — period=year (AC-09-3)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('passes current year date range to query', async () => {
    const qb = makeQb({ data: [], error: null })
    const fromMock = vi.fn().mockReturnValue(qb)
    mockCreateClient.mockReturnValue({ ...authClient('user-1'), from: fromMock } as any)

    await GET(new Request(`http://localhost/api/spend?period=year`))

    // Should have called gte and lte with year boundaries
    expect(qb.gte).toHaveBeenCalledWith('start_date', `${CURRENT_YEAR}-01-01`)
    expect(qb.lte).toHaveBeenCalledWith('start_date', `${CURRENT_YEAR}-12-31`)
  })

  it('only includes contracts from current year', async () => {
    // Simulates DB returning only current-year contracts after date filter
    const qb = makeQb({ data: [acmeTechContract, betaServicesContract], error: null })
    mockCreateClient.mockReturnValue({ ...authClient('user-1'), from: vi.fn().mockReturnValue(qb) } as any)

    const res = await GET(new Request(`http://localhost/api/spend?period=year`))
    const body = await res.json()

    // prevYearContract should NOT appear (DB filtered it out)
    const beta = body.data.bySupplier.find((s: any) => s.supplier_name === 'Beta Services')
    expect(beta.total).toBe(30000) // only current-year contract
  })
})

// ─── GET /api/spend — period=custom ──────────────────────────────────────────

describe('GET /api/spend — period=custom', () => {
  beforeEach(() => vi.clearAllMocks())

  it('passes custom date range to query', async () => {
    const qb = makeQb({ data: [], error: null })
    mockCreateClient.mockReturnValue({ ...authClient('user-1'), from: vi.fn().mockReturnValue(qb) } as any)

    await GET(new Request(`http://localhost/api/spend?period=custom&start=2026-01-01&end=2026-03-31`))

    expect(qb.gte).toHaveBeenCalledWith('start_date', '2026-01-01')
    expect(qb.lte).toHaveBeenCalledWith('start_date', '2026-03-31')
  })

  it('falls back to all when custom period is missing start/end params', async () => {
    const qb = makeQb({ data: [], error: null })
    mockCreateClient.mockReturnValue({ ...authClient('user-1'), from: vi.fn().mockReturnValue(qb) } as any)

    await GET(new Request(`http://localhost/api/spend?period=custom`))

    // No gte/lte called — falls back to all
    expect(qb.gte).not.toHaveBeenCalled()
    expect(qb.lte).not.toHaveBeenCalled()
  })
})

// ─── GET /api/spend — category filter (AC-09-2) ───────────────────────────────

describe('GET /api/spend — category filter (AC-09-2)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('filters by category in application layer', async () => {
    const qb = makeQb({ data: [acmeTechContract, acmeTechContract2, betaServicesContract], error: null })
    mockCreateClient.mockReturnValue({ ...authClient('user-1'), from: vi.fn().mockReturnValue(qb) } as any)

    const res = await GET(new Request('http://localhost/api/spend?category=Technology'))
    const body = await res.json()

    // Only Technology contracts should appear
    expect(body.data.byCategory).toHaveLength(1)
    expect(body.data.byCategory[0].category).toBe('Technology')
    expect(body.data.byCategory[0].total).toBe(70000)

    // Consulting should not appear
    const consulting = body.data.byCategory.find((c: any) => c.category === 'Consulting')
    expect(consulting).toBeUndefined()
  })

  it('filters bySupplier to only those with matching category contracts', async () => {
    const qb = makeQb({ data: [acmeTechContract, betaServicesContract], error: null })
    mockCreateClient.mockReturnValue({ ...authClient('user-1'), from: vi.fn().mockReturnValue(qb) } as any)

    const res = await GET(new Request('http://localhost/api/spend?category=Consulting'))
    const body = await res.json()

    expect(body.data.bySupplier).toHaveLength(1)
    expect(body.data.bySupplier[0].supplier_name).toBe('Beta Services')
  })
})

// ─── GET /api/spend — DB error handling ───────────────────────────────────────

describe('GET /api/spend — DB error handling', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 500 on database error', async () => {
    const qb = makeQb({ data: null, error: { message: 'DB connection failed' } })
    mockCreateClient.mockReturnValue({ ...authClient('user-1'), from: vi.fn().mockReturnValue(qb) } as any)

    const res = await GET(new Request('http://localhost/api/spend'))
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.data).toBeNull()
    expect(body.error.code).toBe('500')
  })
})
