/**
 * NOTIFICATIONS API TESTS — Issues #22, #24 [M2.3]
 *
 * TDD RED  🔴 — these tests FAIL until GET/PUT routes are implemented.
 * TDD GREEN 🟢 — tests pass after routes are implemented.
 *
 * AC-07-3: Unread notification exists → visible with contract name and days remaining
 * AC-07-4: Mark as read → unread count decrements
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the server Supabase factory — prevents next/headers from being called
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'
import { GET } from '@/app/api/notifications/route'
import { PUT } from '@/app/api/notifications/[id]/route'

const mockCreateClient = vi.mocked(createClient)

// ─── Shared mock data ─────────────────────────────────────────────────────────

const mockNotification = {
  id: 'notif-1',
  user_id: 'user-1',
  contract_id: 'contract-1',
  threshold_days: 30,
  message: 'Contract "Support Agreement" renews in 30 days',
  is_read: false,
  created_at: '2026-04-01T09:00:00Z',
}

const readNotification = {
  ...mockNotification,
  id: 'notif-2',
  is_read: true,
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

// ─── GET /api/notifications ───────────────────────────────────────────────────

describe('GET /api/notifications', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    const qb = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    }
    mockCreateClient.mockReturnValue({ ...authClient(null), from: vi.fn().mockReturnValue(qb) } as any)

    const res = await GET(new Request('http://localhost/api/notifications'))
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.data).toBeNull()
    expect(body.error.code).toBe('401')
  })

  it('returns only unread notifications for the current user (AC-07-3)', async () => {
    // Only unread notifications should be returned
    const qb = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [mockNotification], error: null }),
    }
    mockCreateClient.mockReturnValue({ ...authClient('user-1'), from: vi.fn().mockReturnValue(qb) } as any)

    const res = await GET(new Request('http://localhost/api/notifications'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toHaveLength(1)
    expect(body.data[0].is_read).toBe(false)
    expect(body.data[0].id).toBe('notif-1')
    expect(body.error).toBeNull()
  })

  it('returns empty array when no unread notifications exist', async () => {
    const qb = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    }
    mockCreateClient.mockReturnValue({ ...authClient('user-1'), from: vi.fn().mockReturnValue(qb) } as any)

    const res = await GET(new Request('http://localhost/api/notifications'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toEqual([])
    expect(body.error).toBeNull()
  })

  it('returns { data, error: null } shape on success', async () => {
    const qb = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    }
    mockCreateClient.mockReturnValue({ ...authClient('user-1'), from: vi.fn().mockReturnValue(qb) } as any)

    const res = await GET(new Request('http://localhost/api/notifications'))
    const body = await res.json()
    expect(body).toHaveProperty('data')
    expect(body).toHaveProperty('error')
    expect(body.error).toBeNull()
  })
})

// ─── PUT /api/notifications/[id] ─────────────────────────────────────────────

describe('PUT /api/notifications/[id]', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    const qb = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }
    mockCreateClient.mockReturnValue({ ...authClient(null), from: vi.fn().mockReturnValue(qb) } as any)

    const req = new Request('http://localhost/api/notifications/notif-1', { method: 'PUT' })
    const res = await PUT(req, { params: { id: 'notif-1' } })
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.data).toBeNull()
    expect(body.error.code).toBe('401')
  })

  it('marks notification as read and returns 200 (AC-07-4)', async () => {
    // First call (fetch to verify ownership): returns the notification
    // Second call (update): resolves with no error
    const selectQb = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockNotification, error: null }),
    }
    const updateQb = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      // second eq chains into a final eq that resolves
    }
    // Make update chain resolve
    updateQb.eq.mockResolvedValueOnce({ error: null })

    let callCount = 0
    mockCreateClient.mockReturnValue({
      ...authClient('user-1'),
      from: vi.fn().mockImplementation(() => {
        callCount++
        return callCount === 1 ? selectQb : updateQb
      }),
    } as any)

    const req = new Request('http://localhost/api/notifications/notif-1', { method: 'PUT' })
    const res = await PUT(req, { params: { id: 'notif-1' } })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toBeNull()
    expect(body.error).toBeNull()
  })

  it('returns 404 when notification does not belong to current user', async () => {
    // Notification belongs to a different user — select returns null
    const qb = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
    }
    mockCreateClient.mockReturnValue({ ...authClient('user-1'), from: vi.fn().mockReturnValue(qb) } as any)

    const req = new Request('http://localhost/api/notifications/notif-other', { method: 'PUT' })
    const res = await PUT(req, { params: { id: 'notif-other' } })
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.data).toBeNull()
    expect(body.error.code).toBe('404')
  })
})
