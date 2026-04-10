/**
 * CRON NOTIFICATIONS ROUTE TESTS — Issue #27 [M3.0]
 *
 * TDD RED  🔴 — AC-08-1 through AC-08-3 FAIL until Resend email sending is added to the cron route.
 * TDD GREEN 🟢 — tests pass after route is augmented with email sending.
 *
 * AC-08-1: Contract at threshold → email sent to contract owner's email address
 * AC-08-2: Insert fails (23505 unique violation) → email NOT sent (deduplication enforced)
 * AC-08-3: Email uses freshly fetched profile email on each cron run (not cached)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks (hoisted before imports by Vitest) ─────────────────────────────────

const mockSend = vi.fn().mockResolvedValue({ data: { id: 'email-id' }, error: null })

vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: mockSend },
  })),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

// Mock shouldSendAlert so tests control exactly when alerts fire
// (threshold logic is tested in __tests__/lib/alerts.test.ts)
vi.mock('@/lib/alerts', () => ({
  shouldSendAlert: vi.fn(),
  ALERT_THRESHOLDS: [60, 30, 7] as const,
}))

import { createClient } from '@/lib/supabase/server'
import { shouldSendAlert } from '@/lib/alerts'
import { GET } from '@/app/api/cron/notifications/route'

const mockCreateClient = vi.mocked(createClient)
const mockShouldSendAlert = vi.mocked(shouldSendAlert)

// ─── Constants ────────────────────────────────────────────────────────────────

const CONTRACT_UUID = 'c1d2e3f4-a5b6-7890-cdef-123456789012'
const USER_UUID = 'u1v2w3x4-y5z6-7890-abcd-ef1234567890'
const OWNER_EMAIL = 'owner@example.com'
const CRON_SECRET = 'test-cron-secret'

const mockContract = {
  id: CONTRACT_UUID,
  name: 'Acme Service Agreement',
  renewal_date: '2026-05-09',
  notice_period_days: 14,
  created_by: USER_UUID,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeCronRequest(secret = CRON_SECRET) {
  return new Request('http://localhost/api/cron/notifications', {
    headers: { authorization: `Bearer ${secret}` },
  })
}

/** Builds a mock Supabase client dispatching from() by table name. */
function mockSupabaseClient(opts: {
  contracts?: unknown[]
  profileEmail?: string | null
  insertError?: { code: string; message: string } | null
}) {
  const { contracts = [], profileEmail = OWNER_EMAIL, insertError = null } = opts

  // contracts: awaitable select chain
  const contractsQb: any = { select: vi.fn().mockReturnThis() }
  contractsQb.then = (resolve: (v: unknown) => unknown) =>
    Promise.resolve({ data: contracts, error: null }).then(resolve)

  // profiles: select → eq → single
  const profilesQb = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({
      data: profileEmail ? { email: profileEmail } : null,
      error: null,
    }),
  }

  // notifications: insert
  const notificationsQb = {
    insert: vi.fn().mockResolvedValue({ data: null, error: insertError }),
  }

  return {
    from: vi.fn().mockImplementation((table: string) => {
      if (table === 'contracts') return contractsQb
      if (table === 'profiles') return profilesQb
      if (table === 'notifications') return notificationsQb
      return {}
    }),
  }
}

// ─── Auth guard tests ─────────────────────────────────────────────────────────

describe('GET /api/cron/notifications — auth guard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.CRON_SECRET = CRON_SECRET
  })

  it('returns 401 when authorization header is absent', async () => {
    const res = await GET(new Request('http://localhost/api/cron/notifications'))
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error.code).toBe('401')
  })

  it('returns 401 when CRON_SECRET does not match', async () => {
    const res = await GET(
      new Request('http://localhost/api/cron/notifications', {
        headers: { authorization: 'Bearer wrong-secret' },
      })
    )
    expect(res.status).toBe(401)
  })
})

// ─── Email alert tests (AC-08-x) ─────────────────────────────────────────────

describe('GET /api/cron/notifications — email sending (AC-08-1, AC-08-2, AC-08-3)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.CRON_SECRET = CRON_SECRET
    // Default: only the 30-day threshold fires (keeps tests focused on one email)
    mockShouldSendAlert.mockImplementation(
      (_date: Date, threshold: number) => threshold === 30
    )
  })

  it('AC-08-1: sends email to contract owner when insert succeeds', async () => {
    mockCreateClient.mockReturnValue(
      mockSupabaseClient({ contracts: [mockContract], profileEmail: OWNER_EMAIL }) as any
    )

    const res = await GET(makeCronRequest())
    expect(res.status).toBe(200)

    // Exactly one email sent
    expect(mockSend).toHaveBeenCalledOnce()
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: OWNER_EMAIL,
        subject: expect.stringContaining('Acme Service Agreement'),
      })
    )
  })

  it('AC-08-2: does NOT send email when insert fails with unique violation (23505)', async () => {
    mockCreateClient.mockReturnValue(
      mockSupabaseClient({
        contracts: [mockContract],
        profileEmail: OWNER_EMAIL,
        insertError: { code: '23505', message: 'unique_violation' },
      }) as any
    )

    const res = await GET(makeCronRequest())
    expect(res.status).toBe(200)

    // No email — duplicate notification blocked at DB level
    expect(mockSend).not.toHaveBeenCalled()

    // Inserted count reflects no new rows
    const body = await res.json()
    expect(body.data.inserted).toBe(0)
  })

  it('AC-08-3: fetches profile email fresh each cron run (not hardcoded or cached)', async () => {
    const UPDATED_EMAIL = 'new-address@example.com'
    const client = mockSupabaseClient({
      contracts: [mockContract],
      profileEmail: UPDATED_EMAIL,
    }) as any
    mockCreateClient.mockReturnValue(client)

    await GET(makeCronRequest())

    // profiles table was queried to get owner email
    expect(client.from).toHaveBeenCalledWith('profiles')

    // Email was sent to the freshly fetched address
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ to: UPDATED_EMAIL })
    )
  })

  it('returns inserted count of 0 and sends no emails when no contracts exist', async () => {
    mockCreateClient.mockReturnValue(
      mockSupabaseClient({ contracts: [] }) as any
    )

    const res = await GET(makeCronRequest())
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data.inserted).toBe(0)
    expect(mockSend).not.toHaveBeenCalled()
  })

  it('sends no emails when shouldSendAlert returns false for all thresholds', async () => {
    mockShouldSendAlert.mockReturnValue(false)
    mockCreateClient.mockReturnValue(
      mockSupabaseClient({ contracts: [mockContract] }) as any
    )

    await GET(makeCronRequest())
    expect(mockSend).not.toHaveBeenCalled()
  })

  it('continues sending remaining emails if one email call fails', async () => {
    // Two contracts, both at 30-day threshold
    const contract2 = { ...mockContract, id: 'contract-2', name: 'Second Contract' }
    const profilesQb = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { email: OWNER_EMAIL }, error: null }),
    }
    const notificationsQb = {
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    }
    const contractsQb: any = { select: vi.fn().mockReturnThis() }
    contractsQb.then = (resolve: (v: unknown) => unknown) =>
      Promise.resolve({ data: [mockContract, contract2], error: null }).then(resolve)

    // First email send fails, second succeeds
    mockSend
      .mockRejectedValueOnce(new Error('Resend timeout'))
      .mockResolvedValueOnce({ data: { id: 'email-2' }, error: null })

    mockCreateClient.mockReturnValue({
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'contracts') return contractsQb
        if (table === 'profiles') return profilesQb
        if (table === 'notifications') return notificationsQb
        return {}
      }),
    } as any)

    // Should not throw — email failures must not crash the cron
    const res = await GET(makeCronRequest())
    expect(res.status).toBe(200)

    // Both inserts succeeded
    const body = await res.json()
    expect(body.data.inserted).toBe(2)
  })
})
