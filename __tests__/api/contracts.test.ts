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

// ─── GET /api/contracts/:id ───────────────────────────────────────────────────
// Issue #12 [M1.3] — contract detail
//
// TDD RED 🔴 — these tests FAIL until GET is implemented (currently 501).

import { GET as getContract, PUT as putContract, DELETE as deleteContract } from '@/app/api/contracts/[id]/route'

const mockContractWithSupplier = {
  ...mockContract,
  suppliers: { id: 'supplier-1', name: 'Acme Corp' },
}

describe('GET /api/contracts/[id]', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    const qb = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }
    mockCreateClient.mockReturnValue({
      ...authClient(null),
      from: vi.fn().mockReturnValue(qb),
      storage: { from: vi.fn() },
    } as any)

    const req = new Request('http://localhost/api/contracts/contract-1')
    const res = await getContract(req, { params: { id: 'contract-1' } })
    expect(res.status).toBe(401)
  })

  it('returns 200 with contract and supplier data when authenticated', async () => {
    const qb = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockContractWithSupplier, error: null }),
    }
    mockCreateClient.mockReturnValue({
      ...authClient('user-1'),
      from: vi.fn().mockReturnValue(qb),
      storage: { from: vi.fn().mockReturnValue({ createSignedUrl: vi.fn() }) },
    } as any)

    const req = new Request('http://localhost/api/contracts/contract-1')
    const res = await getContract(req, { params: { id: 'contract-1' } })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.name).toBe('Support Agreement')
    expect(body.data.suppliers.name).toBe('Acme Corp')
    expect(body.error).toBeNull()
  })

  it('returns 404 when contract is not found', async () => {
    const qb = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116', message: 'Not found' } }),
    }
    mockCreateClient.mockReturnValue({
      ...authClient('user-1'),
      from: vi.fn().mockReturnValue(qb),
      storage: { from: vi.fn() },
    } as any)

    const req = new Request('http://localhost/api/contracts/nonexistent')
    const res = await getContract(req, { params: { id: 'nonexistent' } })
    expect(res.status).toBe(404)
  })

  it('returns signed_url when pdf_url is set', async () => {
    const contractWithPdf = { ...mockContractWithSupplier, pdf_url: 'some-uuid.pdf' }
    const qb = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: contractWithPdf, error: null }),
    }
    const storageMock = {
      createSignedUrl: vi.fn().mockResolvedValue({
        data: { signedUrl: 'https://storage.example.com/signed' },
        error: null,
      }),
    }
    mockCreateClient.mockReturnValue({
      ...authClient('user-1'),
      from: vi.fn().mockReturnValue(qb),
      storage: { from: vi.fn().mockReturnValue(storageMock) },
    } as any)

    const req = new Request('http://localhost/api/contracts/contract-1')
    const res = await getContract(req, { params: { id: 'contract-1' } })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.signed_url).toBe('https://storage.example.com/signed')
    expect(storageMock.createSignedUrl).toHaveBeenCalledWith('some-uuid.pdf', 900)
  })
})

// ─── PUT /api/contracts/:id ───────────────────────────────────────────────────
// Issue #12 [M1.3] — contract edit
//
// TDD RED 🔴 — these tests FAIL until PUT is implemented (currently 501).

describe('PUT /api/contracts/[id]', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    const qb = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }
    mockCreateClient.mockReturnValue({ ...authClient(null), from: vi.fn().mockReturnValue(qb) } as any)

    const req = new Request('http://localhost/api/contracts/contract-1', {
      method: 'PUT',
      body: JSON.stringify({ name: 'Updated Name' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await putContract(req, { params: { id: 'contract-1' } })
    expect(res.status).toBe(401)
  })

  it('returns 200 with updated contract on valid payload', async () => {
    const updated = { ...mockContract, name: 'Updated Name' }
    const qb = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: updated, error: null }),
    }
    mockCreateClient.mockReturnValue({ ...authClient('user-1'), from: vi.fn().mockReturnValue(qb) } as any)

    const req = new Request('http://localhost/api/contracts/contract-1', {
      method: 'PUT',
      body: JSON.stringify({ name: 'Updated Name' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await putContract(req, { params: { id: 'contract-1' } })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.name).toBe('Updated Name')
    expect(body.error).toBeNull()
  })

  it('returns 400 on Zod validation failure (invalid date format)', async () => {
    const qb = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }
    mockCreateClient.mockReturnValue({ ...authClient('user-1'), from: vi.fn().mockReturnValue(qb) } as any)

    const req = new Request('http://localhost/api/contracts/contract-1', {
      method: 'PUT',
      body: JSON.stringify({ end_date: 'not-a-date' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await putContract(req, { params: { id: 'contract-1' } })
    expect(res.status).toBe(400)
  })
})

// ─── DELETE /api/contracts/:id ────────────────────────────────────────────────
// Issue #13 [M1.3]
//
// TDD RED 🔴 → GREEN 🟢 — DELETE is already implemented; these tests are TDD catch-up.
// AC-01-3: Member DELETE → 403
// AC-01-4: Admin DELETE → 200

describe('DELETE /api/contracts/[id]', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockCreateClient.mockReturnValue({
      ...authClient(null),
      from: vi.fn(),
    } as any)

    const req = new Request('http://localhost/api/contracts/contract-1', { method: 'DELETE' })
    const res = await deleteContract(req, { params: { id: 'contract-1' } })
    expect(res.status).toBe(401)
  })

  it('returns 403 when called by a Member role user (AC-01-3)', async () => {
    const profilesQb = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { role: 'member' }, error: null }),
    }
    mockCreateClient.mockReturnValue({
      ...authClient('user-1'),
      from: vi.fn().mockReturnValue(profilesQb),
    } as any)

    const req = new Request('http://localhost/api/contracts/contract-1', { method: 'DELETE' })
    const res = await deleteContract(req, { params: { id: 'contract-1' } })
    expect(res.status).toBe(403)
  })

  it('deletes contract and returns 200 when called by Admin (AC-01-4)', async () => {
    const profilesQb = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { role: 'admin' }, error: null }),
    }
    const contractsQb = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    }
    mockCreateClient.mockReturnValue({
      ...authClient('user-1'),
      from: vi.fn().mockImplementation((table: string) =>
        table === 'profiles' ? profilesQb : contractsQb
      ),
    } as any)

    const req = new Request('http://localhost/api/contracts/contract-1', { method: 'DELETE' })
    const res = await deleteContract(req, { params: { id: 'contract-1' } })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.id).toBe('contract-1')
    expect(body.error).toBeNull()
  })
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
    // Mock formData() directly — multipart streaming hangs in Node.js test env
    const req = { formData: vi.fn().mockResolvedValue(formData) } as unknown as Request
    return { req, params: { id } }
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
