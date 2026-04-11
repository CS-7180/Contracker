/**
 * SIGNUP API TESTS — Issue #77 [Coverage gate]
 *
 * Tests for POST /api/auth/signup — input validation, duplicate detection,
 * and success path.
 *
 * AC-01-2: valid credentials → session created (user provisioned via admin API)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}))

import { createAdminClient } from '@/lib/supabase/admin'
import { POST } from '@/app/api/auth/signup/route'

const mockCreateAdminClient = vi.mocked(createAdminClient)

// ─── Helper: mock admin Supabase client ──────────────────────────────────────

function makeAdminClient(result: { data: { user: { id: string; email: string } | null }; error: { message: string } | null }) {
  return {
    auth: {
      admin: {
        createUser: vi.fn().mockResolvedValue(result),
      },
    },
  }
}

// ─── POST /api/auth/signup ────────────────────────────────────────────────────

describe('POST /api/auth/signup', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 400 when body is not valid JSON', async () => {
    const req = new Request('http://localhost/api/auth/signup', {
      method: 'POST',
      body: 'not-json',
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error.message).toMatch(/Invalid JSON/i)
  })

  it('returns 400 when email is missing (Zod validation)', async () => {
    const req = new Request('http://localhost/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ password: 'secret123', full_name: 'Alice' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when password is too short (Zod validation)', async () => {
    const req = new Request('http://localhost/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: '123', full_name: 'Alice' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 409 when the email already exists', async () => {
    mockCreateAdminClient.mockReturnValue(
      makeAdminClient({ data: { user: null }, error: { message: 'User already exists' } }) as any
    )

    const req = new Request('http://localhost/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email: 'existing@example.com', password: 'secret123', full_name: 'Alice' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.error.message).toMatch(/already exists/i)
  })

  it('returns 500 on a generic Supabase createUser error', async () => {
    mockCreateAdminClient.mockReturnValue(
      makeAdminClient({ data: { user: null }, error: { message: 'Internal server error' } }) as any
    )

    const req = new Request('http://localhost/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: 'secret123', full_name: 'Alice' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error.message).toBe('Could not create account')
  })

  it('returns 201 with user id and email on success', async () => {
    const mockUser = { id: 'user-uuid-123', email: 'alice@example.com' }
    mockCreateAdminClient.mockReturnValue(
      makeAdminClient({ data: { user: mockUser }, error: null }) as any
    )

    const req = new Request('http://localhost/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email: 'alice@example.com', password: 'secret123', full_name: 'Alice' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.data.user.id).toBe('user-uuid-123')
    expect(body.data.user.email).toBe('alice@example.com')
    expect(body.error).toBeNull()
  })
})
