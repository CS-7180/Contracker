/**
 * DASHBOARD API TESTS — Issue #17 [M2.1]
 *
 * TDD RED  🔴 — these tests FAIL until GET /api/dashboard is implemented.
 * TDD GREEN 🟢 — tests pass after route is implemented.
 *
 * AC-05-1: Correct count per status returned (active/expiring/expired)
 * AC-05-2: Contracts with renewal_date within 30 days appear in expiring_soon
 * AC-05-3: Total portfolio value equals sum of all non-expired contract values
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the server Supabase factory — prevents next/headers from being called
// in jsdom environment. Route handlers get our mock createClient instead.
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'
import { GET } from '@/app/api/dashboard/route'

const mockCreateClient = vi.mocked(createClient)

// ─── Date helpers ─────────────────────────────────────────────────────────────

/** Returns an ISO date string N days from today (negative = past). */
function addDays(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

// ─── Mock query builder helpers ───────────────────────────────────────────────

/** Builds a mock for contracts table: .select() resolves to { data, error } */
function makeContractsQb(contracts: unknown[], dbError: unknown = null) {
  return {
    select: vi.fn().mockResolvedValue({ data: contracts, error: dbError }),
  }
}

function makeClient(userId: string | null, contracts: unknown[] = [], dbError: unknown = null) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: userId ? { id: userId } : null },
        error: null,
      }),
    },
    from: vi.fn().mockReturnValue(makeContractsQb(contracts, dbError)),
  }
}

// ─── Test data ────────────────────────────────────────────────────────────────

// Active: renewal_date 180 days out, end_date 365 days out, notice_period 30 days
// → diffInDays(180) > 30 → active; diffInDays(180) > 60 → green
const activeContract = {
  id: 'c-active',
  name: 'Active Contract',
  end_date: addDays(365),
  renewal_date: addDays(180),
  notice_period_days: 30,
  value: 1000,
}

// Expiring: renewal_date 20 days out, notice_period 30 days
// → diffInDays(20) <= 30 → expiring; within 30-day window → in expiring_soon
const expiringContract = {
  id: 'c-expiring',
  name: 'Expiring Contract',
  end_date: addDays(90),
  renewal_date: addDays(20),
  notice_period_days: 30,
  value: 500,
}

// Expired: end_date in the past
// → end_date < today → expired; excluded from total_value and expiring_soon
const expiredContract = {
  id: 'c-expired',
  name: 'Expired Contract',
  end_date: addDays(-10),
  renewal_date: addDays(-30),
  notice_period_days: 30,
  value: 200,
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('GET /api/dashboard', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockCreateClient.mockReturnValue(makeClient(null) as any)
    const res = await GET(new Request('http://localhost/api/dashboard'))
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.data).toBeNull()
    expect(body.error.code).toBe('401')
  })

  it('returns correct status counts for a known set of contracts', async () => {
    mockCreateClient.mockReturnValue(
      makeClient('user-1', [activeContract, expiringContract, expiredContract]) as any
    )
    const res = await GET(new Request('http://localhost/api/dashboard'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.active_count).toBe(1)
    expect(body.data.expiring_count).toBe(1)
    expect(body.data.expired_count).toBe(1)
  })

  it('total_value sums only non-expired contract values', async () => {
    mockCreateClient.mockReturnValue(
      makeClient('user-1', [activeContract, expiringContract, expiredContract]) as any
    )
    const res = await GET(new Request('http://localhost/api/dashboard'))
    const body = await res.json()
    // 1000 (active) + 500 (expiring) = 1500; expired 200 excluded
    expect(body.data.total_value).toBe(1500)
  })

  it('expiring_soon includes contracts with renewal_date within 30 days and not expired', async () => {
    mockCreateClient.mockReturnValue(
      makeClient('user-1', [activeContract, expiringContract, expiredContract]) as any
    )
    const res = await GET(new Request('http://localhost/api/dashboard'))
    const body = await res.json()
    const ids = body.data.expiring_soon.map((c: { id: string }) => c.id)
    expect(ids).toContain('c-expiring')
    expect(ids).not.toContain('c-active')
    expect(ids).not.toContain('c-expired')
  })

  it('expiring_soon items include risk_colour', async () => {
    mockCreateClient.mockReturnValue(
      makeClient('user-1', [expiringContract]) as any
    )
    const res = await GET(new Request('http://localhost/api/dashboard'))
    const body = await res.json()
    expect(body.data.expiring_soon[0]).toHaveProperty('risk_colour')
  })

  it('returns 500 when DB query fails', async () => {
    mockCreateClient.mockReturnValue(
      makeClient('user-1', [], { message: 'DB error' }) as any
    )
    const res = await GET(new Request('http://localhost/api/dashboard'))
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.data).toBeNull()
    expect(body.error.code).toBe('500')
  })

  it('returns { data, error: null } shape on success', async () => {
    mockCreateClient.mockReturnValue(makeClient('user-1', []) as any)
    const res = await GET(new Request('http://localhost/api/dashboard'))
    const body = await res.json()
    expect(body.error).toBeNull()
    expect(body.data).toHaveProperty('active_count')
    expect(body.data).toHaveProperty('expiring_count')
    expect(body.data).toHaveProperty('expired_count')
    expect(body.data).toHaveProperty('total_value')
    expect(body.data).toHaveProperty('expiring_soon')
  })
})
