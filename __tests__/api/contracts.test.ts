/**
 * CONTRACT API TESTS — Issue #10 [M1.3]
 *
 * TDD RED  🔴 — these tests FAIL until POST route is implemented.
 * TDD GREEN 🟢 — tests pass after POST /api/contracts is in place.
 *
 * AC-03-1: Valid POST → 201 with all submitted fields in response
 * AC-03-6: Member calling DELETE /api/contracts/:id → 403 (covered in [id]/route.ts)
 * AC-01-4: Admin calling DELETE /api/contracts/:id → 200, contract deleted
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the server Supabase factory — prevents next/headers from being called
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'
import { GET as getContracts, POST as postContract } from '@/app/api/contracts/route'

const mockCreateClient = vi.mocked(createClient)

// ─── Shared mock data ─────────────────────────────────────────────────────────

const mockContract = {
  id: 'contract-1',
  contract_number: 'CON-ABCD1234',
  name: 'Support Agreement',
  type: 'service',
  supplier_id: 'supplier-1',
  category: 'Technology',
  start_date: '2025-01-01',
  end_date: '2026-01-01',
  renewal_date: '2025-10-01',
  notice_period_days: 30,
  value: 50000,
  pdf_url: null,
  created_by: 'user-1',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}

const validContractBody = {
  name: 'Support Agreement',
  type: 'service',
  supplier_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  start_date: '2025-01-01',
  end_date: '2026-01-01',
  renewal_date: '2025-10-01',
  notice_period_days: 30,
  value: 50000,
  category: 'Technology',
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

// ─── POST /api/contracts ──────────────────────────────────────────────────────

describe('POST /api/contracts', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    const qb = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }
    mockCreateClient.mockReturnValue({ ...authClient(null), from: vi.fn().mockReturnValue(qb) } as any)

    const req = new Request('http://localhost/api/contracts', {
      method: 'POST',
      body: JSON.stringify(validContractBody),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await postContract(req)
    expect(res.status).toBe(401)
  })

  it('creates a contract and returns 201 with all fields (AC-03-1)', async () => {
    const qb = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockContract, error: null }),
    }
    mockCreateClient.mockReturnValue({ ...authClient('user-1'), from: vi.fn().mockReturnValue(qb) } as any)

    const req = new Request('http://localhost/api/contracts', {
      method: 'POST',
      body: JSON.stringify(validContractBody),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await postContract(req)
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.data.name).toBe('Support Agreement')
    expect(body.data.type).toBe('service')
    expect(body.error).toBeNull()
  })

  it('auto-generates contract_number when omitted', async () => {
    const contractWithAutoNumber = { ...mockContract, contract_number: 'CON-AUTOGEN' }
    const qb = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: contractWithAutoNumber, error: null }),
    }
    mockCreateClient.mockReturnValue({ ...authClient('user-1'), from: vi.fn().mockReturnValue(qb) } as any)

    const bodyWithoutNumber = { ...validContractBody }
    const req = new Request('http://localhost/api/contracts', {
      method: 'POST',
      body: JSON.stringify(bodyWithoutNumber),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await postContract(req)
    expect(res.status).toBe(201)
    // Verify insert was called with a contract_number (auto-generated)
    expect(qb.insert).toHaveBeenCalledWith(
      expect.objectContaining({ contract_number: expect.stringMatching(/^CON-/) })
    )
  })

  it('returns 400 when name is missing (Zod validation)', async () => {
    const qb = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }
    mockCreateClient.mockReturnValue({ ...authClient('user-1'), from: vi.fn().mockReturnValue(qb) } as any)

    const req = new Request('http://localhost/api/contracts', {
      method: 'POST',
      body: JSON.stringify({ ...validContractBody, name: '' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await postContract(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when supplier_id is not a UUID', async () => {
    const qb = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }
    mockCreateClient.mockReturnValue({ ...authClient('user-1'), from: vi.fn().mockReturnValue(qb) } as any)

    const req = new Request('http://localhost/api/contracts', {
      method: 'POST',
      body: JSON.stringify({ ...validContractBody, supplier_id: 'not-a-uuid' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await postContract(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when end_date is before start_date', async () => {
    const qb = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }
    mockCreateClient.mockReturnValue({ ...authClient('user-1'), from: vi.fn().mockReturnValue(qb) } as any)

    const req = new Request('http://localhost/api/contracts', {
      method: 'POST',
      body: JSON.stringify({ ...validContractBody, end_date: '2024-01-01', start_date: '2025-01-01' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await postContract(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when renewal_date is after end_date', async () => {
    const qb = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }
    mockCreateClient.mockReturnValue({ ...authClient('user-1'), from: vi.fn().mockReturnValue(qb) } as any)

    const req = new Request('http://localhost/api/contracts', {
      method: 'POST',
      body: JSON.stringify({ ...validContractBody, renewal_date: '2027-01-01', end_date: '2026-01-01' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await postContract(req)
    expect(res.status).toBe(400)
  })
})

// ─── GET /api/contracts ───────────────────────────────────────────────────────

describe('GET /api/contracts', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    const qb = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    }
    mockCreateClient.mockReturnValue({ ...authClient(null), from: vi.fn().mockReturnValue(qb) } as any)

    const res = await getContracts(new Request('http://localhost/api/contracts'))
    expect(res.status).toBe(401)
  })

  it('returns list of contracts when authenticated', async () => {
    const qb = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [mockContract], error: null }),
    }
    mockCreateClient.mockReturnValue({ ...authClient('user-1'), from: vi.fn().mockReturnValue(qb) } as any)

    const res = await getContracts(new Request('http://localhost/api/contracts'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toHaveLength(1)
    expect(body.data[0].name).toBe('Support Agreement')
    expect(body.error).toBeNull()
  })
})

// ─── DELETE /api/contracts/:id ────────────────────────────────────────────────

describe('DELETE /api/contracts/[id]', () => {
  it.todo('returns 403 when called by a Member role user')
  it.todo('deletes contract and returns 200 when called by Admin')
  it.todo('returns 401 when not authenticated')
})
