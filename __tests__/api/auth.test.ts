/**
 * AUTH API TESTS — Issue #7 [M1.1]
 *
 * TDD RED  🔴 — these tests FAIL until lib/auth.ts exists and DELETE routes
 *                enforce auth + role checks.
 * TDD GREEN 🟢 — tests pass after requireAdmin() is implemented.
 *
 * AC-01-3: Member → DELETE /api/contracts/:id → 403
 * AC-01-4: Admin  → DELETE /api/contracts/:id → 200
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the server Supabase factory — prevents next/headers from being called
// in jsdom environment. Route handlers get our mock createClient instead.
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'                              // RED: doesn't exist yet
import { DELETE as deleteContract } from '@/app/api/contracts/[id]/route'
import { DELETE as deleteSupplier } from '@/app/api/suppliers/[id]/route'

const mockCreateClient = vi.mocked(createClient)

// ─── Mock query builder helpers ───────────────────────────────────────────────

/** Builds a mock for the profiles table chain: .select().eq().single() */
function makePrQb(role: string | null) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({
      data: role ? { role } : null,
      error: null,
    }),
  }
}

/** Builds a mock for destructive table ops: .delete().eq() or .update().eq() */
function makeDbQb(err: unknown = null) {
  return {
    delete: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue({ error: err }),
  }
}

/**
 * Assembles a full Supabase mock client.
 * `from('profiles')` → profile query builder
 * `from(<anything else>)` → destructive op query builder
 */
function makeClient(userId: string | null, role: string | null, dbError: unknown = null) {
  const prQb = makePrQb(role)
  const dbQb = makeDbQb(dbError)
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: userId ? { id: userId } : null },
        error: null,
      }),
    },
    from: vi.fn((table: string) => (table === 'profiles' ? prQb : dbQb)),
  }
}

// ─── requireAdmin() unit tests ────────────────────────────────────────────────

describe('requireAdmin()', () => {
  it('returns 403 response for member role', async () => {
    const mockSupabase = { from: vi.fn().mockReturnValue(makePrQb('member')) }
    const result = await requireAdmin(mockSupabase as any, 'user-1')
    expect(result.profile).toBeNull()
    const res = result.error as Response
    expect(res.status).toBe(403)
  })

  it('returns profile for admin role', async () => {
    const mockSupabase = { from: vi.fn().mockReturnValue(makePrQb('admin')) }
    const result = await requireAdmin(mockSupabase as any, 'admin-1')
    expect(result.error).toBeNull()
    expect((result as any).profile?.role).toBe('admin')
  })
})

// ─── DELETE /api/contracts/:id ────────────────────────────────────────────────

describe('DELETE /api/contracts/:id', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockCreateClient.mockReturnValue(makeClient(null, null) as any)
    const req = new Request('http://localhost/api/contracts/c-1', { method: 'DELETE' })
    const res = await deleteContract(req, { params: { id: 'c-1' } })
    expect(res.status).toBe(401)
  })

  it('returns 403 when called by a member', async () => {
    mockCreateClient.mockReturnValue(makeClient('user-1', 'member') as any)
    const req = new Request('http://localhost/api/contracts/c-1', { method: 'DELETE' })
    const res = await deleteContract(req, { params: { id: 'c-1' } })
    expect(res.status).toBe(403)
  })

  it('returns 200 when called by admin', async () => {
    mockCreateClient.mockReturnValue(makeClient('admin-1', 'admin') as any)
    const req = new Request('http://localhost/api/contracts/c-1', { method: 'DELETE' })
    const res = await deleteContract(req, { params: { id: 'c-1' } })
    expect(res.status).toBe(200)
  })
})

// ─── DELETE /api/suppliers/:id ────────────────────────────────────────────────

describe('DELETE /api/suppliers/:id', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 403 when called by a member', async () => {
    mockCreateClient.mockReturnValue(makeClient('user-1', 'member') as any)
    const req = new Request('http://localhost/api/suppliers/s-1', { method: 'DELETE' })
    const res = await deleteSupplier(req, { params: { id: 's-1' } })
    expect(res.status).toBe(403)
  })

  it('returns 200 when called by admin', async () => {
    mockCreateClient.mockReturnValue(makeClient('admin-1', 'admin') as any)
    const req = new Request('http://localhost/api/suppliers/s-1', { method: 'DELETE' })
    const res = await deleteSupplier(req, { params: { id: 's-1' } })
    expect(res.status).toBe(200)
  })
})
