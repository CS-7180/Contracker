/**
 * SUPPLIER API TESTS — Issue #9 [M1.2]
 *
 * TDD RED  🔴 — these tests FAIL until GET/POST/PUT routes are implemented.
 * TDD GREEN 🟢 — tests pass after full supplier API is in place.
 *
 * AC-02-1: Member can POST a valid supplier → 201
 * AC-02-2: Member calling DELETE → 403 (covered in auth.test.ts)
 * AC-02-3: Admin soft-deletes supplier — status='inactive', contracts intact
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the server Supabase factory — prevents next/headers from being called
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'
import { GET as getSuppliers, POST as postSupplier } from '@/app/api/suppliers/route'

/** Returns an ISO date string N days from today (negative = past). */
function addDays(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}
import {
  GET as getSupplier,
  PUT as putSupplier,
  DELETE as deleteSupplier,
} from '@/app/api/suppliers/[id]/route'

const mockCreateClient = vi.mocked(createClient)

// ─── Shared mock data ─────────────────────────────────────────────────────────

const mockSupplier = {
  id: 'supplier-1',
  name: 'Acme Corp',
  contact_name: 'Jane Smith',
  contact_email: 'jane@acme.com',
  contact_phone: '555-0100',
  category: 'Technology',
  status: 'active',
  created_by: 'user-1',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

const mockSupplierWithRelations = {
  ...mockSupplier,
  contracts: [{ id: 'contract-1', name: 'Support Agreement' }],
  certifications: [],
}

// ─── Helper: minimal auth Supabase mock ──────────────────────────────────────

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

// ─── GET /api/suppliers ───────────────────────────────────────────────────────

describe('GET /api/suppliers', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    const qb = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    }
    mockCreateClient.mockReturnValue({ ...authClient(null), from: vi.fn().mockReturnValue(qb) } as any)

    const res = await getSuppliers(new Request('http://localhost/api/suppliers'))
    expect(res.status).toBe(401)
  })

  it('returns list of active suppliers when authenticated', async () => {
    const supplierWithNoContracts = { ...mockSupplier, contracts: [] }
    const qb = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [supplierWithNoContracts], error: null }),
    }
    mockCreateClient.mockReturnValue({ ...authClient('user-1'), from: vi.fn().mockReturnValue(qb) } as any)

    const res = await getSuppliers(new Request('http://localhost/api/suppliers'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toHaveLength(1)
    expect(body.data[0].name).toBe('Acme Corp')
    expect(body.error).toBeNull()
  })

  // ── max_contract_risk roll-up (AC-06-4) ─────────────────────────────────────

  it('includes max_contract_risk field on each supplier (AC-06-4)', async () => {
    const supplierWithRedContract = {
      ...mockSupplier,
      contracts: [{ renewal_date: addDays(10), notice_period_days: 30, end_date: addDays(60) }],
    }
    const qb = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [supplierWithRedContract], error: null }),
    }
    mockCreateClient.mockReturnValue({ ...authClient('user-1'), from: vi.fn().mockReturnValue(qb) } as any)

    const res = await getSuppliers(new Request('http://localhost/api/suppliers'))
    const body = await res.json()
    expect(body.data[0]).toHaveProperty('max_contract_risk')
    // 10 days <= notice_period 30 → red
    expect(body.data[0].max_contract_risk).toBe('red')
  })

  it('returns max_contract_risk = amber when worst contract is amber', async () => {
    const supplierWithAmberContract = {
      ...mockSupplier,
      contracts: [{ renewal_date: addDays(50), notice_period_days: 30, end_date: addDays(120) }],
    }
    const qb = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [supplierWithAmberContract], error: null }),
    }
    mockCreateClient.mockReturnValue({ ...authClient('user-1'), from: vi.fn().mockReturnValue(qb) } as any)

    const res = await getSuppliers(new Request('http://localhost/api/suppliers'))
    const body = await res.json()
    // 50 days > notice(30) but <= 60 → amber
    expect(body.data[0].max_contract_risk).toBe('amber')
  })

  it('returns max_contract_risk = null when supplier has no contracts', async () => {
    const supplierNoContracts = { ...mockSupplier, contracts: [] }
    const qb = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [supplierNoContracts], error: null }),
    }
    mockCreateClient.mockReturnValue({ ...authClient('user-1'), from: vi.fn().mockReturnValue(qb) } as any)

    const res = await getSuppliers(new Request('http://localhost/api/suppliers'))
    const body = await res.json()
    expect(body.data[0].max_contract_risk).toBeNull()
  })
})

// ─── POST /api/suppliers ──────────────────────────────────────────────────────

describe('POST /api/suppliers', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    const qb = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }
    mockCreateClient.mockReturnValue({ ...authClient(null), from: vi.fn().mockReturnValue(qb) } as any)

    const req = new Request('http://localhost/api/suppliers', {
      method: 'POST',
      body: JSON.stringify({ name: 'Acme Corp' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await postSupplier(req)
    expect(res.status).toBe(401)
  })

  it('creates a supplier and returns 201 when called by a Member (AC-02-1)', async () => {
    const qb = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockSupplier, error: null }),
    }
    mockCreateClient.mockReturnValue({ ...authClient('user-1'), from: vi.fn().mockReturnValue(qb) } as any)

    const req = new Request('http://localhost/api/suppliers', {
      method: 'POST',
      body: JSON.stringify({ name: 'Acme Corp', category: 'Technology' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await postSupplier(req)
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.data.name).toBe('Acme Corp')
    expect(body.error).toBeNull()
  })

  it('returns 400 when name is missing (Zod validation)', async () => {
    const qb = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }
    mockCreateClient.mockReturnValue({ ...authClient('user-1'), from: vi.fn().mockReturnValue(qb) } as any)

    const req = new Request('http://localhost/api/suppliers', {
      method: 'POST',
      body: JSON.stringify({ contact_email: 'no-name@example.com' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await postSupplier(req)
    expect(res.status).toBe(400)
  })
})

// ─── GET /api/suppliers/:id ───────────────────────────────────────────────────

describe('GET /api/suppliers/:id', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    const qb = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }
    mockCreateClient.mockReturnValue({ ...authClient(null), from: vi.fn().mockReturnValue(qb) } as any)

    const res = await getSupplier(
      new Request('http://localhost/api/suppliers/supplier-1'),
      { params: { id: 'supplier-1' } }
    )
    expect(res.status).toBe(401)
  })

  it('returns supplier with linked contracts and certifications (AC-02-4)', async () => {
    const qb = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockSupplierWithRelations, error: null }),
    }
    mockCreateClient.mockReturnValue({ ...authClient('user-1'), from: vi.fn().mockReturnValue(qb) } as any)

    const res = await getSupplier(
      new Request('http://localhost/api/suppliers/supplier-1'),
      { params: { id: 'supplier-1' } }
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.name).toBe('Acme Corp')
    expect(Array.isArray(body.data.contracts)).toBe(true)
    expect(body.data.contracts).toHaveLength(1)
  })
})

// ─── PUT /api/suppliers/:id ───────────────────────────────────────────────────

describe('PUT /api/suppliers/:id', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    const qb = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }
    mockCreateClient.mockReturnValue({ ...authClient(null), from: vi.fn().mockReturnValue(qb) } as any)

    const req = new Request('http://localhost/api/suppliers/supplier-1', {
      method: 'PUT',
      body: JSON.stringify({ name: 'Updated Corp' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await putSupplier(req, { params: { id: 'supplier-1' } })
    expect(res.status).toBe(401)
  })

  it('updates supplier and returns 200 when authenticated', async () => {
    const updated = { ...mockSupplier, name: 'Updated Corp' }
    const qb = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: updated, error: null }),
    }
    mockCreateClient.mockReturnValue({ ...authClient('user-1'), from: vi.fn().mockReturnValue(qb) } as any)

    const req = new Request('http://localhost/api/suppliers/supplier-1', {
      method: 'PUT',
      body: JSON.stringify({ name: 'Updated Corp' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await putSupplier(req, { params: { id: 'supplier-1' } })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.name).toBe('Updated Corp')
  })
})

// ─── DELETE /api/suppliers/:id ────────────────────────────────────────────────

describe('DELETE /api/suppliers/:id', () => {
  beforeEach(() => vi.clearAllMocks())

  it('soft-deletes by setting status=inactive, not hard-deleting (AC-02-3)', async () => {
    const profileQb = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { role: 'admin' }, error: null }),
    }
    const updateQb = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    }
    mockCreateClient.mockReturnValue({
      ...authClient('admin-1'),
      from: vi.fn((table: string) => (table === 'profiles' ? profileQb : updateQb)),
    } as any)

    const req = new Request('http://localhost/api/suppliers/supplier-1', { method: 'DELETE' })
    const res = await deleteSupplier(req, { params: { id: 'supplier-1' } })
    expect(res.status).toBe(200)
    // Verify soft-delete: update() called with inactive, never delete()
    expect(updateQb.update).toHaveBeenCalledWith({ status: 'inactive' })
    expect(updateQb.eq).toHaveBeenCalledWith('id', 'supplier-1')
  })
})
