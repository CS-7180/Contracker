/**
 * TEAM API TESTS — Issue #32 [M3.3]
 *
 * TDD RED  🔴 — all tests FAIL until team routes are implemented (stubs return 501).
 * TDD GREEN 🟢 — tests pass after GET /api/team, POST /api/team/invite,
 *                PUT /api/team/[id], and DELETE /api/team/[id] are implemented.
 *
 * AC-11-1: Admin submits email invitation → inviteUserByEmail called, 200 response
 * AC-11-3: Admin promotes Member to Admin → profiles.role updated to 'admin'
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks (hoisted before imports) ──────────────────────────────────────────

const { mockInvite } = vi.hoisted(() => ({
  mockInvite: vi.fn().mockResolvedValue({ data: { user: { id: 'new-user-id' } }, error: null }),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn().mockReturnValue({
    auth: {
      admin: {
        inviteUserByEmail: mockInvite,
      },
    },
  }),
}))

import { createClient } from '@/lib/supabase/server'
import { GET } from '@/app/api/team/route'
import { POST } from '@/app/api/team/invite/route'
import { PUT, DELETE } from '@/app/api/team/[id]/route'

const mockCreateClient = vi.mocked(createClient)

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

/** Returns a mock qb for requireAdmin() — select('role').eq().single() */
function profileQb(role: 'admin' | 'member' | null) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({
      data: role ? { role } : null,
      error: null,
    }),
  }
}

/** Returns a mock qb for member list — select().order() */
function membersQb(members: unknown[]) {
  return {
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data: members, error: null }),
  }
}

/** Returns a mock qb for update — update().eq() */
function updateQb(error: unknown = null) {
  return {
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue({ data: null, error }),
  }
}

/** Returns a mock qb for delete — delete().eq() */
function deleteQb(error: unknown = null) {
  return {
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue({ data: null, error }),
  }
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ADMIN_UUID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
const MEMBER_UUID = 'm1n2o3p4-q5r6-7890-stuv-wx1234567890'

const mockMembers = [
  {
    id: ADMIN_UUID,
    email: 'admin@example.com',
    full_name: 'Admin User',
    role: 'admin',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: MEMBER_UUID,
    email: 'member@example.com',
    full_name: 'Member User',
    role: 'member',
    created_at: '2024-01-02T00:00:00Z',
  },
]

// ─── GET /api/team ────────────────────────────────────────────────────────────

describe('GET /api/team', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockCreateClient.mockReturnValue({
      ...authClient(null),
      from: vi.fn().mockReturnValue(profileQb(null)),
    } as any)

    const res = await GET(new Request('http://localhost/api/team'))
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error.code).toBe('401')
  })

  it('returns 403 when authenticated as member', async () => {
    let callCount = 0
    mockCreateClient.mockReturnValue({
      ...authClient(MEMBER_UUID),
      from: vi.fn().mockImplementation(() => {
        callCount++
        return callCount === 1 ? profileQb('member') : membersQb([])
      }),
    } as any)

    const res = await GET(new Request('http://localhost/api/team'))
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error.code).toBe('403')
  })

  it('returns 200 with member list when authenticated as admin', async () => {
    let callCount = 0
    mockCreateClient.mockReturnValue({
      ...authClient(ADMIN_UUID),
      from: vi.fn().mockImplementation(() => {
        callCount++
        return callCount === 1 ? profileQb('admin') : membersQb(mockMembers)
      }),
    } as any)

    const res = await GET(new Request('http://localhost/api/team'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.error).toBeNull()
    expect(body.data).toHaveLength(2)
    expect(body.data[0].role).toBe('admin')
  })
})

// ─── POST /api/team/invite ────────────────────────────────────────────────────

describe('POST /api/team/invite', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockCreateClient.mockReturnValue({
      ...authClient(null),
      from: vi.fn().mockReturnValue(profileQb(null)),
    } as any)

    const res = await POST(
      new Request('http://localhost/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'new@example.com' }),
      })
    )
    expect(res.status).toBe(401)
  })

  it('returns 403 when member calls invite', async () => {
    mockCreateClient.mockReturnValue({
      ...authClient(MEMBER_UUID),
      from: vi.fn().mockReturnValue(profileQb('member')),
    } as any)

    const res = await POST(
      new Request('http://localhost/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'new@example.com' }),
      })
    )
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error.code).toBe('403')
  })

  it('returns 400 when email is missing', async () => {
    mockCreateClient.mockReturnValue({
      ...authClient(ADMIN_UUID),
      from: vi.fn().mockReturnValue(profileQb('admin')),
    } as any)

    const res = await POST(
      new Request('http://localhost/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
    )
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error.code).toBe('400')
  })

  it('returns 400 when email format is invalid', async () => {
    mockCreateClient.mockReturnValue({
      ...authClient(ADMIN_UUID),
      from: vi.fn().mockReturnValue(profileQb('admin')),
    } as any)

    const res = await POST(
      new Request('http://localhost/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'not-an-email' }),
      })
    )
    expect(res.status).toBe(400)
  })

  it('AC-11-1: sends invite and returns 200 when admin provides valid email', async () => {
    mockCreateClient.mockReturnValue({
      ...authClient(ADMIN_UUID),
      from: vi.fn().mockReturnValue(profileQb('admin')),
    } as any)

    const res = await POST(
      new Request('http://localhost/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'newmember@example.com' }),
      })
    )
    expect(res.status).toBe(200)

    // Supabase Admin API was called with the correct email (AC-11-1)
    expect(mockInvite).toHaveBeenCalledOnce()
    expect(mockInvite).toHaveBeenCalledWith('newmember@example.com')

    const body = await res.json()
    expect(body.error).toBeNull()
    expect(body.data.email).toBe('newmember@example.com')
  })
})

// ─── PUT /api/team/[id] ───────────────────────────────────────────────────────

describe('PUT /api/team/[id]', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockCreateClient.mockReturnValue({
      ...authClient(null),
      from: vi.fn().mockReturnValue(profileQb(null)),
    } as any)

    const res = await PUT(
      new Request('http://localhost/api/team/some-id', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'admin' }),
      }),
      { params: { id: MEMBER_UUID } }
    )
    expect(res.status).toBe(401)
  })

  it('returns 403 when member tries to update a role', async () => {
    mockCreateClient.mockReturnValue({
      ...authClient(MEMBER_UUID),
      from: vi.fn().mockReturnValue(profileQb('member')),
    } as any)

    const res = await PUT(
      new Request('http://localhost/api/team/some-id', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'admin' }),
      }),
      { params: { id: ADMIN_UUID } }
    )
    expect(res.status).toBe(403)
  })

  it('returns 403 when admin tries to change their own role', async () => {
    mockCreateClient.mockReturnValue({
      ...authClient(ADMIN_UUID),
      from: vi.fn().mockReturnValue(profileQb('admin')),
    } as any)

    const res = await PUT(
      new Request('http://localhost/api/team/some-id', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'member' }),
      }),
      { params: { id: ADMIN_UUID } } // same as user.id
    )
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error.message).toMatch(/own role/i)
  })

  it('returns 400 when role value is invalid', async () => {
    mockCreateClient.mockReturnValue({
      ...authClient(ADMIN_UUID),
      from: vi.fn().mockReturnValue(profileQb('admin')),
    } as any)

    const res = await PUT(
      new Request('http://localhost/api/team/some-id', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'super_admin' }),
      }),
      { params: { id: MEMBER_UUID } }
    )
    expect(res.status).toBe(400)
  })

  it('AC-11-3: promotes member to admin — returns 200 and updates role', async () => {
    let callCount = 0
    mockCreateClient.mockReturnValue({
      ...authClient(ADMIN_UUID),
      from: vi.fn().mockImplementation(() => {
        callCount++
        return callCount === 1 ? profileQb('admin') : updateQb()
      }),
    } as any)

    const res = await PUT(
      new Request('http://localhost/api/team/some-id', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'admin' }),
      }),
      { params: { id: MEMBER_UUID } }
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toBeNull()
    expect(body.error).toBeNull()
  })

  it('AC-11-3: demotes admin to member — returns 200 and updates role', async () => {
    let callCount = 0
    mockCreateClient.mockReturnValue({
      ...authClient(ADMIN_UUID),
      from: vi.fn().mockImplementation(() => {
        callCount++
        return callCount === 1 ? profileQb('admin') : updateQb()
      }),
    } as any)

    const res = await PUT(
      new Request('http://localhost/api/team/some-id', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'member' }),
      }),
      { params: { id: MEMBER_UUID } }
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.error).toBeNull()
  })
})

// ─── DELETE /api/team/[id] ────────────────────────────────────────────────────

describe('DELETE /api/team/[id]', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockCreateClient.mockReturnValue({
      ...authClient(null),
      from: vi.fn().mockReturnValue(profileQb(null)),
    } as any)

    const res = await DELETE(
      new Request('http://localhost/api/team/some-id', { method: 'DELETE' }),
      { params: { id: MEMBER_UUID } }
    )
    expect(res.status).toBe(401)
  })

  it('returns 403 when member tries to delete', async () => {
    mockCreateClient.mockReturnValue({
      ...authClient(MEMBER_UUID),
      from: vi.fn().mockReturnValue(profileQb('member')),
    } as any)

    const res = await DELETE(
      new Request('http://localhost/api/team/some-id', { method: 'DELETE' }),
      { params: { id: ADMIN_UUID } }
    )
    expect(res.status).toBe(403)
  })

  it('returns 403 when admin tries to delete their own account', async () => {
    mockCreateClient.mockReturnValue({
      ...authClient(ADMIN_UUID),
      from: vi.fn().mockReturnValue(profileQb('admin')),
    } as any)

    const res = await DELETE(
      new Request('http://localhost/api/team/some-id', { method: 'DELETE' }),
      { params: { id: ADMIN_UUID } } // same as user.id
    )
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error.message).toMatch(/own account/i)
  })

  it('returns 200 when admin deletes a member', async () => {
    let callCount = 0
    mockCreateClient.mockReturnValue({
      ...authClient(ADMIN_UUID),
      from: vi.fn().mockImplementation(() => {
        callCount++
        return callCount === 1 ? profileQb('admin') : deleteQb()
      }),
    } as any)

    const res = await DELETE(
      new Request('http://localhost/api/team/some-id', { method: 'DELETE' }),
      { params: { id: MEMBER_UUID } }
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toBeNull()
    expect(body.error).toBeNull()
  })
})
