---
date: 2026-04-09
phase: 4
issues: "#27, #32"
prs: "#63 (open, CI green), #64 (open, CI green)"
branches: "feature/27-email-renewal-alerts, feature/32-team-settings-invite"
tests_before: 174 passing (main after Phase 3)
tests_after: 211 passing (feature/32 branch)
---

# Session Log — Phase 4: Email Renewal Alerts + Team Settings / Member Invitation

## Summary

Completed both remaining Sprint 3 tracks (issues #27 and #32) in a single session. Both PRs have all CI stages passing and full test plans executed, including browser smoke tests via Playwright MCP.

---

## Track A — Email Renewal Alerts (issue #27 → PR #63)

### What was built

Augmented the existing cron route (`app/api/cron/notifications/route.ts`) which already inserted in-app notification rows and deduplicated via a DB unique index. Added Resend email delivery alongside each successful insert.

**Changes to `app/api/cron/notifications/route.ts`:**
- Imported `Resend` from the `resend` package (already installed at `^4.0.0`)
- Added `name` to the contracts `select` query (needed for email subject line)
- After `if (!insertError) { inserted++ }`: fetch contract owner's profile email fresh from `profiles` table (satisfies AC-08-3 — uses current email, not cached), then `resend.emails.send()`
- Email failure wrapped in `try/catch` — logs error but does not abort cron; in-app notification already created
- Deduplication is natural: email fires only when DB insert succeeds; unique index `(contract_id, threshold_days)` prevents duplicate inserts → email never fires twice (AC-08-2)

**Security hardening applied (security-reviewer agent findings):**
- `escapeHtml()` helper — escapes `<>&"'` in contract name before inserting into HTML email body (A03 injection)
- `sanitizeEmailHeader()` helper — strips `\r\n` from contract name in email subject to prevent header injection (A03)
- `.limit(2000)` on contracts query — bounds serverless memory usage (A04)
- Generic `'Failed to fetch contracts'` in 500 response — no internal DB error message leaked (A05)

**New test file: `__tests__/api/cron.test.ts`** — 8 tests:
- Auth guard: 401 on missing/wrong `CRON_SECRET`
- AC-08-1: contract at 30-day threshold, insert succeeds → `mockSend` called with `to: ownerEmail`
- AC-08-2: insert fails with `{ code: '23505' }` (unique violation) → `mockSend` NOT called
- AC-08-3: `from('profiles')` called each invocation → email address read fresh
- No contracts → 0 inserted, no emails sent
- `shouldSendAlert` returns false for all thresholds → 0 inserted, no emails sent
- Email call throws → cron continues, remaining contracts processed

### TDD commit sequence

```
test: add failing cron email tests (AC-08-1, AC-08-2, AC-08-3)   ← RED (2 tests failed)
feat: augment cron route to send Resend email on successful insert ← GREEN (8/8 pass)
fix: harden cron route against email injection and unbounded fetch ← security hardening
fix: lazy-init Resend inside handler to unblock next build in CI  ← build fix
```

### Key mock pattern — vi.hoisted()

`new Resend(process.env.RESEND_API_KEY)` is called at module level in the original implementation. `vi.mock('resend', () => ...)` factories are hoisted before imports. Using a `const mockSend = vi.fn()` above the mock factory causes a TDZ ReferenceError at runtime.

**Fix:** Use `vi.hoisted()` which runs before both `vi.mock` factories and imports:

```typescript
const { mockSend } = vi.hoisted(() => ({
  mockSend: vi.fn().mockResolvedValue({ data: { id: 'email-id' }, error: null })
}))
vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({ emails: { send: mockSend } }))
}))
```

Also mocked `@/lib/alerts` to control `shouldSendAlert` deterministically in tests:
```typescript
vi.mock('@/lib/alerts', () => ({
  shouldSendAlert: vi.fn(),
  ALERT_THRESHOLDS: [60, 30, 7] as const,
}))
```

The `contractsQb` mock needed both `.select()` and `.limit()` methods (`.limit(2000)` was added during security hardening):
```typescript
const contractsQb: any = {
  select: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
}
contractsQb.then = (resolve: any) => Promise.resolve({ data: contracts, error: null }).then(resolve)
```

### CI build failure and fix

`next build` during CI page data collection executed `new Resend(process.env.RESEND_API_KEY)` at module level. In the CI build environment, `RESEND_API_KEY` is absent → Resend constructor throws: `"Error: Missing API key. Pass it to the constructor 'new Resend("re_123")'"`.

**Fix:** Moved `const resend = new Resend(...)` inside the `GET` handler, after the `CRON_SECRET` auth check. Request-time instantiation — `RESEND_API_KEY` is available at runtime on Vercel but not at `next build` time in CI.

### Test plan execution results

| Item | Result |
|------|--------|
| `npm test` — 201/201 | ✅ |
| `npm run type-check` | ✅ clean |
| `npm run lint` | ✅ clean |
| `security-reviewer` agent | ✅ 3 findings, all fixed |
| Manual cron trigger `GET /api/cron/notifications` with `Authorization: Bearer <CRON_SECRET>` | ✅ `{"data":{"inserted":0},"error":null}` |
| CI all 8 stages | ✅ pass (after lazy-init fix push) |

---

## Track B — Team Settings + Member Invitation (issue #32 → PR #64)

### What was built

Replaced all stubs with full implementations.

**`app/api/team/route.ts`** — replaced 501 stub:
- `GET` — Admin only: `requireAdmin()` → `from('profiles').select('id, email, full_name, role, created_at').order('created_at')` → `{ data: members, error: null }`

**`app/api/team/invite/route.ts`** — replaced 501 stub:
- `POST` — Admin only: `requireAdmin()` → Zod validate `{ email: z.string().email() }` → `createAdminClient().auth.admin.inviteUserByEmail(email)` → `{ data: { email }, error: null }`
- Invited user's `profiles` row gets `role='member'` by default (DB column default)

**`app/api/team/[id]/route.ts`** — replaced 501 stubs with full PUT + DELETE:
- `PUT` — Admin only: `requireAdmin()` → self-change guard (403 if `params.id === user.id`) → UUID validation → Zod `{ role: z.enum(['admin', 'member']) }` → update profiles
- `DELETE` — Admin only: `requireAdmin()` → self-delete guard (403) → UUID validation → delete from profiles

**`app/(app)/settings/team/page.tsx`** — replaced ComingSoonPage:
- `'use client'` component with `useState`, `useEffect`, `useCallback`
- `h2 "Team Management"` heading (level 2, required for Playwright `getByRole('heading', { level: 2 })`)
- Member table: Name/Email, Role badge (amber Admin / slate Member), Joined date, role dropdown for non-self non-super_admin members
- Role dropdown calls `PUT /api/team/[id]` on change → optimistic update in state, re-fetch on error
- Invite form: email input + "Send Invite" button, disabled when `!inviteEmail.trim()` — calls `POST /api/team/invite`
- Inline success/error messages with icons
- Loading skeleton, error state, empty state
- Framer Motion with `useReducedMotion` gate

**`e2e/team.spec.ts`** — new E2E spec:
- Unauthenticated redirect: `GET /settings/team` → `/login`
- Authenticated renders: h2, dark theme, all 6 sidebar links, invite form with email input + Send Invite button, "Current Members" section
- Form validation: Send Invite disabled with empty email
- `test.fixme` for AC-11-1 invite happy path (requires disposable unregistered email)
- `test.fixme` for AC-11-3 role dropdown (requires second seeded team member)

**`playwright.config.ts`** — added `team-pages` project after `compliance-pages`.

### Security hardening (security-reviewer finding)

`params.id` (URL path parameter) was passed directly to `.eq('id', params.id)` in both PUT and DELETE without UUID format validation. A malformed value could cause unexpected query behavior (A03).

**Fix:** Added UUID guard in both handlers, immediately after the self-modification guard:
```typescript
const uuidResult = z.string().uuid().safeParse(params.id)
if (!uuidResult.success) {
  return NextResponse.json(
    { data: null, error: { message: 'Invalid member ID', code: '400' } },
    { status: 400 }
  )
}
```

This fix also required updating `MEMBER_UUID` in `__tests__/api/team.test.ts` from `'m1n2o3p4-q5r6-7890-stuv-wx1234567890'` (non-hex characters) to `'b2c3d4e5-f6a7-8901-bcde-f12345678901'` (valid hex UUID). The invalid constant had worked before the UUID validation was added, causing 3 test failures after the fix.

### TDD commit sequence

```
test: add failing team API tests (AC-11-1, AC-11-3)                               ← RED
feat: implement GET /api/team, POST /api/team/invite, PUT+DELETE /api/team/[id]    ← GREEN
feat: build team settings UI with member table and invite form                     ← UI
test: add E2E spec for team settings page and register playwright project          ← E2E
fix: validate params.id as UUID in team/[id] route (security-reviewer A03)        ← security
docs: update remaining-work with Phase 4 PR status (#63, #64)                     ← docs
```

### Key mock pattern — double from('profiles') with callCount

Every admin route calls `requireAdmin()` which itself calls `from('profiles').select('role').eq('id', userId)`. The route handler then also calls `from('profiles')` for its data operation. This double call breaks a single static mock.

**Fix:** `callCount` dispatcher per test:
```typescript
let callCount = 0
mockCreateClient.mockReturnValue({
  ...authClient(ADMIN_UUID),
  from: vi.fn().mockImplementation(() => {
    callCount++
    return callCount === 1 ? profileQb('admin') : dataQb
  }),
} as any)
```

`callCount` is reset to `0` in a `beforeEach`, ensuring each test starts clean.

### Playwright browser verification (pre-commit checklist)

- Navigated to `http://localhost:3000/settings/team` (authenticated as e2e@contracker.dev)
- Confirmed `h2 "Team Management"`, dark theme, all 6 sidebar nav links
- Confirmed invite form rendered with disabled "Send Invite" button (email empty)
- Filled email field with `test@example.com` → confirmed "Send Invite" button enabled
- Confirmed "Current Members" section with member table (5 live members loaded from DB)
- Signed out via the Sign out button → confirmed redirect to `/login`
- Navigated to `/settings/team` without session → confirmed redirect to `/login` (middleware working)

### Test plan execution results

| Item | Result |
|------|--------|
| `npm test` — 211/211 | ✅ |
| `npm run type-check` | ✅ clean |
| `npm run lint` | ✅ clean |
| Security reviewer: UUID param validation | ✅ fixed and committed |
| Browser E2E smoke: heading, sidebar, invite form, member table | ✅ confirmed in browser |
| Unauthenticated redirect `/settings/team` → `/login` | ✅ confirmed in browser |
| CI all 8 stages | ✅ all pass |

---

## Test count progression

| Checkpoint | Count |
|-----------|-------|
| Start of session (main) | 174 |
| After PR #63 (feature/27) | 201 |
| After PR #64 (feature/32) | 211 |

---

## Key decisions

- **Lazy-init Resend** — `new Resend()` must be inside the handler, not at module level, to survive `next build` in environments without `RESEND_API_KEY`. This is the correct pattern for any SDK that throws on construction with a missing key.
- **UUID validation on `params.id`** — all dynamic route handlers that use URL params in DB queries should validate them as UUIDs with Zod. Consistent with the pattern established in `certifications/[id]` (Phase 3).
- **MEMBER_UUID in tests must be valid hex** — `z.string().uuid()` enforces RFC 4122 format. Test constant UUIDs that use non-hex characters (`m`, `n`, `s`, `t`, etc.) will fail once UUID validation is added to the handler.
- **`test.fixme` for seed-dependent E2E tests** — AC-11-1 (invite happy path) and AC-11-3 (role dropdown for non-self member) require either a disposable email address or a second seeded team member. Marked as `test.fixme` per the Playwright protocol rather than `test.todo` (which throws in Playwright 1.x).
- **`onboarding@resend.dev` as sender** — works on Resend free tier without domain verification. Should be replaced with a verified custom domain before production use.
