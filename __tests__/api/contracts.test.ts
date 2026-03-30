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

// ─── POST /api/contracts/[id]/upload ─────────────────────────────────────────
// Issue #11 [M1.3] — AC-03-4, AC-03-5
//
// TDD RED 🔴 — these tests FAIL until the upload route is implemented.

import { POST as uploadPdf } from '@/app/api/contracts/[id]/upload/route'

describe('POST /api/contracts/[id]/upload', () => {
  beforeEach(() => vi.clearAllMocks())

  function makeUploadReq(file: File | null, id = 'contract-1') {
    const formData = new FormData()
    if (file) formData.append('pdf', file)
    return {
      req: new Request(`http://localhost/api/contracts/${id}/upload`, {
        method: 'POST',
        body: formData,
      }),
      params: { id },
    }
  }

  it('returns 401 when not authenticated', async () => {
    mockCreateClient.mockReturnValue({ ...authClient(null), from: vi.fn(), storage: { from: vi.fn() } } as any)
    const file = new File(['%PDF-1.0'], 'test.pdf', { type: 'application/pdf' })
    const { req, params } = makeUploadReq(file)
    const res = await uploadPdf(req, { params })
    expect(res.status).toBe(401)
  })

  it('returns 400 when no file is attached', async () => {
    mockCreateClient.mockReturnValue({ ...authClient('user-1'), from: vi.fn(), storage: { from: vi.fn() } } as any)
    const { req, params } = makeUploadReq(null)
    const res = await uploadPdf(req, { params })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error.message).toMatch(/no file/i)
  })

  it('returns 400 when file is not a PDF (AC-03-5)', async () => {
    mockCreateClient.mockReturnValue({ ...authClient('user-1'), from: vi.fn(), storage: { from: vi.fn() } } as any)
    const file = new File(['hello'], 'doc.txt', { type: 'text/plain' })
    const { req, params } = makeUploadReq(file)
    const res = await uploadPdf(req, { params })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error.message).toMatch(/pdf/i)
  })

  it('returns 400 when file exceeds 10 MB', async () => {
    mockCreateClient.mockReturnValue({ ...authClient('user-1'), from: vi.fn(), storage: { from: vi.fn() } } as any)
    const bigBuffer = new Uint8Array(11 * 1024 * 1024)
    const file = new File([bigBuffer], 'big.pdf', { type: 'application/pdf' })
    const { req, params } = makeUploadReq(file)
    const res = await uploadPdf(req, { params })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error.message).toMatch(/10\s*mb|size/i)
  })

  it('uploads valid PDF and returns 200 with pdf_url (AC-03-4)', async () => {
    const storageMock = {
      upload: vi.fn().mockResolvedValue({ data: { path: 'some-uuid.pdf' }, error: null }),
    }
    const qb = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    }
    mockCreateClient.mockReturnValue({
      ...authClient('user-1'),
      from: vi.fn().mockReturnValue(qb),
      storage: { from: vi.fn().mockReturnValue(storageMock) },
    } as any)

    const file = new File(['%PDF-1.0'], 'contract.pdf', { type: 'application/pdf' })
    const { req, params } = makeUploadReq(file)
    const res = await uploadPdf(req, { params })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.pdf_url).toBeTruthy()
    expect(body.error).toBeNull()
    expect(storageMock.upload).toHaveBeenCalledWith(
      expect.stringMatching(/\.pdf$/),
      expect.any(File),
      { contentType: 'application/pdf' }
    )
  })
})
