# Session Log — Issue #5: Login, Signup Pages + Notifications UI [M1.1]

**Date:** Saturday, March 29, 2026
**Branch:** `feature/5-auth-pages` (PR #38 — open)
**Sprint:** Sprint 1 · M1.1
**Issue:** [#5 — [M1.1] Build login and signup pages](https://github.com/CS-7180/Contracker/issues/5)

---

## Session Summary

Built login and signup pages with full TDD (RED → GREEN → REFACTOR), then applied two rounds of visual redesign to reach an enterprise-grade glassmorphism + aurora aesthetic. Also scaffolded the notifications page with stagger animations and traffic-light design for the teammate (Vineela) to wire up in M2.3.

---

## What Was Implemented

### 1. TDD — Auth Pages (RED → GREEN)

**RED commit** — `__tests__/auth/login.test.tsx` and `__tests__/auth/signup.test.tsx` written first with 5 tests each (10 total):

| Test | What It Verifies |
|------|-----------------|
| Renders email + password fields | `getByLabelText(/email/i)`, `getByLabelText(/^password$/i)` |
| Show/hide password toggle | Button aria-label flip, input type change |
| Supabase `signInWithPassword` called on submit | Mock called with `{ email, password }` |
| Error message displayed on failure | `role="alert"` text visible |
| Redirects to `/dashboard` on success | `router.push('/dashboard')` called |

Signup tests additionally verify full name field and `signUp` call with `options.data.full_name`.

**GREEN commit** — Login and signup pages implemented with:
- Supabase `signInWithPassword` / `signUp` calls
- Show/hide password toggle with `aria-label` (exact match `/^password$/i` required to avoid aria-label collision)
- Error display with `role="alert"`
- Redirect to `/dashboard` on success

**Bug fixed during TDD:** `getByLabelText(/password/i)` matched both the `<Label>Password</Label>` and the show/hide button's `aria-label="Show password"`. Fixed by using `/^password$/i` (exact regex) in all test queries.

### 2. App Shell + Root Redirect

- Created `app/page.tsx` with `redirect('/login')` — fixes Vercel 404 on root URL
- Built `app/(app)/layout.tsx` — dark navy sidebar shell with Framer Motion `motion.main`, `useReducedMotion`, `aria-current="page"`, semantic `ul/li` nav

### 3. Design System Established

Used `ui-ux-pro-max` plugin to generate:
- `design-system/contracker/MASTER.md` — global tokens (Plus Jakarta Sans, indigo primary, dark sidebar)
- `design-system/contracker/pages/auth.md` — auth page overrides
- `design-system/contracker/pages/dashboard.md` — dashboard page overrides

Switched from DM Sans → **Plus Jakarta Sans** per enterprise B2B recommendation.

### 4. Visual Redesign — Round 1 (Glassmorphism)

**`refactor:` commit** — Replaced plain white card with glassmorphism:
- Dark gradient background: `from-slate-950 via-indigo-950 to-slate-900`
- Three Framer Motion animated orbs (indigo/violet/blue), gated by `useReducedMotion`
- Desktop split layout: left branding panel + right glass form card
- Glass card: `backdrop-blur-2xl bg-white/6 border-white/12`
- Gradient CTA button: indigo → violet with `whileTap: { scale: 0.97 }`

### 5. Visual Redesign — Round 2 (Aurora UI)

**`refactor:` commit** — Replaced static orbs with CSS aurora mesh gradient:
- `@keyframes aurora-flow` in `globals.css` — conic gradient rotating slowly (15s loop)
- Vibrant aurora colors: indigo 0.35, violet 0.3, emerald 0.2, blue 0.25 opacity
- `filter: blur(80px) saturate(1.5)` — rich ambient light field behind glass card
- Glass card opacity raised: `bg-white/0.12` (from 0.06) — frost now visible on aurora bg
- Feature icons distinct colors: blue (FileText), emerald (ShieldCheck), amber (DollarSign)
- Gradient headline text: white→indigo first line, indigo→violet→emerald second line
- Reduced motion: `prefers-reduced-motion` media query pauses `aurora-flow` animation

### 6. Notifications Page — Full UI Scaffold

Built complete notifications page replacing the `// TODO` stub, ready for Vineela to wire to real API in M2.3:

- **Framer Motion stagger** — `staggerChildren: 0.06`, slide-in from right per card, `AnimatePresence` exit animation
- **Traffic-light system** — red (≤7d threshold), amber (≤30d), green (≤60d) with ring, icon, badge
- **Filter tabs** — All / Unread / Read with live unread count badge
- **Per-card** — mark as read button, unread dot indicator, left indigo border on unread
- **Mark all as read** — header button, animates cards to `opacity-60`
- **Animated pulse ring** — on critical (7d) unread cards via `animate-pulse-ring` keyframe
- **Empty state** — Bell icon + "All caught up" message when filter returns no results
- **5 realistic mock notifications** — Azure, Salesforce, Office 365, AWS, Slack contracts

---

## Key Technical Decisions

| Decision | Reason |
|----------|--------|
| `/^password$/i` exact regex in tests | Prevents collision with `aria-label="Show password"` on toggle button |
| CSS conic-gradient aurora (not JS orbs) | GPU-composited, more performant, richer color field than 3 Framer Motion blobs |
| `motion.main` instead of `motion.div` for page content | Semantic HTML — landmark element for screen readers |
| `backdrop-blur` via inline style (not Tailwind class) | Ensures Safari (`-webkit-backdrop-filter`) compatibility |
| Mock data in notifications page | Teammate can see realistic UI immediately; replace with `GET /api/notifications` in M2.3 |

---

## Files Created / Modified

```
app/(auth)/login/page.tsx                    — Login page (TDD + aurora redesign)
app/(auth)/signup/page.tsx                   — Signup page (TDD + aurora redesign)
app/(app)/layout.tsx                         — App shell with dark sidebar
app/(app)/notifications/page.tsx             — Notifications UI scaffold
app/page.tsx                                 — Root redirect to /login
app/globals.css                              — aurora-flow keyframe, .aurora-bg, .glass utilities
app/layout.tsx                               — Plus Jakarta Sans font swap
__tests__/auth/login.test.tsx                — 5 login tests (RED → GREEN)
__tests__/auth/signup.test.tsx               — 5 signup tests (RED → GREEN)
design-system/contracker/MASTER.md           — Global design tokens
design-system/contracker/pages/auth.md       — Auth page overrides
design-system/contracker/pages/dashboard.md  — Dashboard page overrides
```

---

## Test Results

```
✓ __tests__/auth/login.test.tsx   (5 tests) 186ms
✓ __tests__/auth/signup.test.tsx  (5 tests) 197ms

Test Files: 2 passed (2)
Tests:      10 passed (10)
```

---

## Issue Checklist Completions

All tasks and acceptance criteria in Issue #5 completed:
- [x] Login page renders with email + password fields
- [x] Signup page renders with full name + email + password fields
- [x] Supabase Auth calls wired correctly
- [x] Show/hide password toggle functional
- [x] Error message displayed on auth failure
- [x] Redirect to `/dashboard` on success
- [x] 10/10 unit tests passing

---

## Next Steps

- Issue #6: Implement Next.js middleware auth gate (redirect unauthenticated → `/login`)
- Issue #7: Implement `requireAdmin()` server-side helper + auth API tests
- Vineela (M2.3): Replace mock data in `notifications/page.tsx` with real `GET /api/notifications` call
