/**
 * CERTIFICATIONS API TESTS — Issues #30, #31 [M3.2]
 *
 * TDD RED  🔴 — these tests FAIL until GET/POST/PUT/DELETE routes are implemented.
 * TDD GREEN 🟢 — tests pass after routes are implemented.
 *
 * AC-10-1: expiry_date > 30 days → certification status = 'valid'
 * AC-10-2: expiry_date within 30 days → certification status = 'expiring'
 * AC-10-3: expiry_date in the past → certification status = 'expired'
 * AC-10-4: Supplier with at least one expired cert → flagged red on compliance page
 * AC-10-5: New certification created → appears on supplier profile and compliance page
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the server Supabase factory — prevents next/headers from being called
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'
import { GET, POST } from '@/app/api/certifications/route'
import { PUT, DELETE } from '@/app/api/certifications/[id]/route'

const mockCreateClient = vi.mocked(createClient)

// ─── Date helpers ─────────────────────────────────────────────────────────────

function addDays(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

// ─── Auth helper ──────────────────────────────────────────────────────────────

function authClient(userId: string | null, role: 'admin' | 'member' = 'member') {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: userId ? { id: userId } : null },
        error: null,
      }),
    },
  }
}

function profileQb(role: 'admin' | 'member') {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { role }, error: null }),
  }
}

// ─── Shared mock data ─────────────────────────────────────────────────────────

const SUPPLIER_UUID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
const CERT_UUID = 'b2c3d4e5-f6a7-8901-bcde-f12345678901'

const mockCert = {
  id: CERT_UUID,
  supplier_id: SUPPLIER_UUID,
  cert_type: 'ISO',
  issued_date: '2024-01-01',
  expiry_date: addDays(90), // valid
  document_url: null,
  created_by: 'user-1',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

const expiredCert = {
  ...mockCert,
  id: 'cert-expired',
  cert_type: 'NDA',
  expiry_date: addDays(-5), // expired
}

const expiringCert = {
  ...mockCert,
  id: 'cert-expiring',
  cert_type: 'insurance',
  expiry_date: addDays(15), // expiring (within 30 days)
}

const validCreateBody = {
  supplier_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  cert_type: 'ISO',
  issued_date: '2024-01-01',
  expiry_date: addDays(365),
}

// ─── GET /api/certifications ──────────────────────────────────────────────────

describe('GET /api/certifications', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    const qb = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    }
    mockCreateClient.mockReturnValue({ ...authClient(null), from: vi.fn().mockReturnValue(qb) } as any)

    const res = await GET(new Request('http://localhost/api/certifications?supplier_id=sup-1'))
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.data).toBeNull()
    expect(body.error.code).toBe('401')
  })

  it('returns 400 when supplier_id is missing', async () => {
    const qb = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    }
    mockCreateClient.mockReturnValue({ ...authClient('user-1'), from: vi.fn().mockReturnValue(qb) } as any)

    const res = await GET(new Request('http://localhost/api/certifications'))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error.code).toBe('400')
  })

  it('returns 400 when supplier_id is not a valid UUID', async () => {
    const qb = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    }
    mockCreateClient.mockReturnValue({ ...authClient('user-1'), from: vi.fn().mockReturnValue(qb) } as any)

    const res = await GET(new Request('http://localhost/api/certifications?supplier_id=not-a-uuid'))
    expect(res.status).toBe(400)
  })

  it('returns certifications with computed status appended (AC-10-1, AC-10-2, AC-10-3)', async () => {
    const qb = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [mockCert, expiredCert, expiringCert], error: null }),
    }
    mockCreateClient.mockReturnValue({ ...authClient('user-1'), from: vi.fn().mockReturnValue(qb) } as any)

    const res = await GET(new Request(`http://localhost/api/certifications?supplier_id=${SUPPLIER_UUID}`))
    expect(res.status).toBe(200)
    const body = await res.json()

    expect(body.error).toBeNull()
    const certs = body.data

    const valid = certs.find((c: any) => c.id === CERT_UUID)
    const expired = certs.find((c: any) => c.id === 'cert-expired')
    const expiring = certs.find((c: any) => c.id === 'cert-expiring')

    expect(valid.status).toBe('valid')   // AC-10-1
    expect(expired.status).toBe('expired') // AC-10-3
    expect(expiring.status).toBe('expiring') // AC-10-2
  })

  it('returns empty array when supplier has no certifications', async () => {
    const qb = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    }
    mockCreateClient.mockReturnValue({ ...authClient('user-1'), from: vi.fn().mockReturnValue(qb) } as any)

    const res = await GET(new Request('http://localhost/api/certifications?supplier_id=a1b2c3d4-e5f6-7890-abcd-ef1234567890'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toEqual([])
  })
})

// ─── POST /api/certifications ─────────────────────────────────────────────────

describe('POST /api/certifications', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    const qb = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }
    mockCreateClient.mockReturnValue({ ...authClient(null), from: vi.fn().mockReturnValue(qb) } as any)

    const req = new Request('http://localhost/api/certifications', {
      method: 'POST',
      body: JSON.stringify(validCreateBody),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('creates certification and returns 201 with computed status (AC-10-5)', async () => {
    const newCert = { ...mockCert, id: 'cert-new', expiry_date: addDays(365) }
    const qb = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: newCert, error: null }),
    }
    mockCreateClient.mockReturnValue({ ...authClient('user-1'), from: vi.fn().mockReturnValue(qb) } as any)

    const req = new Request('http://localhost/api/certifications', {
      method: 'POST',
      body: JSON.stringify(validCreateBody),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.data.id).toBe('cert-new')
    expect(body.data.status).toBe('valid') // computed status injected
    expect(body.error).toBeNull()
  })

  it('returns 400 when cert_type is invalid', async () => {
    const qb = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }
    mockCreateClient.mockReturnValue({ ...authClient('user-1'), from: vi.fn().mockReturnValue(qb) } as any)

    const req = new Request('http://localhost/api/certifications', {
      method: 'POST',
      body: JSON.stringify({ ...validCreateBody, cert_type: 'INVALID' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when supplier_id is not a UUID', async () => {
    const qb = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }
    mockCreateClient.mockReturnValue({ ...authClient('user-1'), from: vi.fn().mockReturnValue(qb) } as any)

    const req = new Request('http://localhost/api/certifications', {
      method: 'POST',
      body: JSON.stringify({ ...validCreateBody, supplier_id: 'not-a-uuid' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when expiry_date format is invalid', async () => {
    const qb = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }
    mockCreateClient.mockReturnValue({ ...authClient('user-1'), from: vi.fn().mockReturnValue(qb) } as any)

    const req = new Request('http://localhost/api/certifications', {
      method: 'POST',
      body: JSON.stringify({ ...validCreateBody, expiry_date: '01/01/2026' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})

// ─── PUT /api/certifications/[id] ────────────────────────────────────────────

describe('PUT /api/certifications/[id]', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    const qb = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }
    mockCreateClient.mockReturnValue({ ...authClient(null), from: vi.fn().mockReturnValue(qb) } as any)

    const req = new Request(`http://localhost/api/certifications/${CERT_UUID}`, {
      method: 'PUT',
      body: JSON.stringify({ expiry_date: addDays(400) }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await PUT(req, { params: { id: CERT_UUID } })
    expect(res.status).toBe(401)
  })

  it('updates certification and returns 200 with computed status', async () => {
    const updatedCert = { ...mockCert, expiry_date: addDays(400) }

    // fetchQb: select('id').eq().single() — fetch-first existence check
    const fetchQb = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: CERT_UUID }, error: null }),
    }
    // updateQb: update().eq().select().single()
    const updateQb: any = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: updatedCert, error: null }),
    }
    let callCount = 0
    mockCreateClient.mockReturnValue({
      ...authClient('user-1'),
      from: vi.fn().mockImplementation(() => {
        callCount++
        return callCount === 1 ? fetchQb : updateQb
      }),
    } as any)

    const req = new Request(`http://localhost/api/certifications/${CERT_UUID}`, {
      method: 'PUT',
      body: JSON.stringify({ expiry_date: addDays(400) }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await PUT(req, { params: { id: CERT_UUID } })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.status).toBe('valid')
    expect(body.error).toBeNull()
  })

  it('returns 400 when update body contains invalid cert_type', async () => {
    const qb = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }
    mockCreateClient.mockReturnValue({ ...authClient('user-1'), from: vi.fn().mockReturnValue(qb) } as any)

    const req = new Request(`http://localhost/api/certifications/${CERT_UUID}`, {
      method: 'PUT',
      body: JSON.stringify({ cert_type: 'INVALID_TYPE' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await PUT(req, { params: { id: CERT_UUID } })
    expect(res.status).toBe(400)
  })
})

// ─── DELETE /api/certifications/[id] ─────────────────────────────────────────

describe('DELETE /api/certifications/[id] — role checks', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    const qb = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }
    mockCreateClient.mockReturnValue({ ...authClient(null), from: vi.fn().mockReturnValue(qb) } as any)

    const req = new Request('http://localhost/api/certifications/cert-1', { method: 'DELETE' })
    const res = await DELETE(req, { params: { id: 'cert-1' } })
    expect(res.status).toBe(401)
  })

  it('returns 403 when Member tries to delete', async () => {
    let callCount = 0
    const profileQbMock = profileQb('member')
    const deleteQb = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    }
    mockCreateClient.mockReturnValue({
      ...authClient('user-1', 'member'),
      from: vi.fn().mockImplementation(() => {
        callCount++
        return callCount === 1 ? profileQbMock : deleteQb
      }),
    } as any)

    const req = new Request(`http://localhost/api/certifications/${CERT_UUID}`, { method: 'DELETE' })
    const res = await DELETE(req, { params: { id: CERT_UUID } })
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error.code).toBe('403')
  })

  it('deletes certification when Admin requests (returns 200)', async () => {
    let callCount = 0
    const profileQbMock = profileQb('admin')
    const deleteQb = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    }
    mockCreateClient.mockReturnValue({
      ...authClient('user-1', 'admin'),
      from: vi.fn().mockImplementation(() => {
        callCount++
        return callCount === 1 ? profileQbMock : deleteQb
      }),
    } as any)

    const req = new Request(`http://localhost/api/certifications/${CERT_UUID}`, { method: 'DELETE' })
    const res = await DELETE(req, { params: { id: CERT_UUID } })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toBeNull()
    expect(body.error).toBeNull()
  })
})

// ─── Certification status computation (AC-10-1, AC-10-2, AC-10-3) ────────────

describe('Certification status computation edge cases', () => {
  beforeEach(() => vi.clearAllMocks())

  it('status = valid when expiry_date is exactly 31 days from today (AC-10-1)', async () => {
    const cert = { ...mockCert, expiry_date: addDays(31) }
    const qb = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [cert], error: null }),
    }
    mockCreateClient.mockReturnValue({ ...authClient('user-1'), from: vi.fn().mockReturnValue(qb) } as any)

    const res = await GET(new Request('http://localhost/api/certifications?supplier_id=a1b2c3d4-e5f6-7890-abcd-ef1234567890'))
    const body = await res.json()
    expect(body.data[0].status).toBe('valid')
  })

  it('status = expiring when expiry_date is exactly 30 days from today (AC-10-2)', async () => {
    const cert = { ...mockCert, expiry_date: addDays(30) }
    const qb = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [cert], error: null }),
    }
    mockCreateClient.mockReturnValue({ ...authClient('user-1'), from: vi.fn().mockReturnValue(qb) } as any)

    const res = await GET(new Request('http://localhost/api/certifications?supplier_id=a1b2c3d4-e5f6-7890-abcd-ef1234567890'))
    const body = await res.json()
    expect(body.data[0].status).toBe('expiring')
  })

  it('status = expired when expiry_date is today (AC-10-3)', async () => {
    const today = new Date().toISOString().split('T')[0]
    const cert = { ...mockCert, expiry_date: today }
    const qb = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [cert], error: null }),
    }
    mockCreateClient.mockReturnValue({ ...authClient('user-1'), from: vi.fn().mockReturnValue(qb) } as any)

    const res = await GET(new Request('http://localhost/api/certifications?supplier_id=a1b2c3d4-e5f6-7890-abcd-ef1234567890'))
    const body = await res.json()
    expect(body.data[0].status).toBe('expired')
  })
})
