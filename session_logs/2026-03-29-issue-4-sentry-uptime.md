# Session Log — Issue #4: Sentry Error Tracking + Better Uptime [M1.0]

**Date:** Saturday, March 29, 2026
**Branch:** `feature/4-sentry-uptime` → merged to `main`
**Sprint:** Sprint 1 · M1.0
**Issue:** [#4 — [M1.0] Install Sentry and create Better Uptime monitor](https://github.com/CS-7180/Contracker/issues/4)
**PR:** [#37](https://github.com/CS-7180/Contracker/pull/37) — merged

---

## Session Summary

Configured Sentry error tracking for all three Next.js 14 App Router runtimes (client, server, edge) and wrapped `next.config.mjs` with `withSentryConfig`. Discovered and fixed a pre-existing `geist` package gap. Better Uptime monitor is a manual external setup (noted as such in the PR).

---

## What Was Implemented

### 1. Sentry Configuration (3 runtimes)

Next.js 14 App Router requires separate Sentry init files per runtime:

| File | Runtime | DSN env var |
|------|---------|------------|
| `sentry.client.config.ts` | Browser | `NEXT_PUBLIC_SENTRY_DSN` |
| `sentry.server.config.ts` | Node.js server | `SENTRY_DSN` |
| `sentry.edge.config.ts` | Edge (middleware) | `SENTRY_DSN` |

All configs use `tracesSampleRate: 1.0` for full trace capture and `debug: false` for production silence.

### 2. Next.js 14 `instrumentation.ts` pattern

The `@sentry/nextjs` v8 SDK recommends using Next.js's `instrumentation.ts` with `register()` hook (instead of deprecated `sentry.server.config.ts` direct import). Created `instrumentation.ts` that dynamically imports server/edge configs based on `NEXT_RUNTIME`:

```typescript
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}
```

### 3. `next.config.mjs` — wrapped with `withSentryConfig`

```javascript
export default withSentryConfig(nextConfig, {
  silent: !process.env.CI,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
})
```

Source maps are hidden from bundles (`hideSourceMaps: true`) to avoid leaking source in production.

### 4. Environment Variables

Added `NEXT_PUBLIC_SENTRY_DSN` to `.env.local.example` alongside existing `SENTRY_DSN`. Both must be set in Vercel env vars (same DSN value — one is public for client, one is server-only).

### 5. Bug Fix — Missing `geist` Package

`app/layout.tsx` imported from `geist/font/sans` but the package wasn't installed. Fixed by running `npm install geist`. This was a pre-existing gap from the initial scaffold.

### 6. TDD — Tests Written First

```
test: add failing tests for Sentry configuration [M1.0]   ← RED (8 failing)
feat: configure Sentry for Next.js 14 App Router [M1.0]    ← GREEN (82/82 passing)
```

Tests verified: DSN env var usage, `withSentryConfig` wrapper present, all 3 config files exist, `instrumentation.ts` register pattern used.

---

## Manual Step (Cannot Be Automated)

**Better Uptime** requires logging into the external dashboard to create an HTTP monitor:
- URL: production Vercel URL
- Check interval: every 3 minutes
- Alert threshold: 2 consecutive failures (6 minutes)
- Alert contacts: Raj + Vineela emails

This was documented in the PR and issue but cannot be scripted.

---

## Files Created / Modified

```
sentry.client.config.ts        — Client-side Sentry init (NEXT_PUBLIC_SENTRY_DSN)
sentry.server.config.ts        — Server-side Sentry init (SENTRY_DSN)
sentry.edge.config.ts          — Edge runtime Sentry init (SENTRY_DSN)
instrumentation.ts             — Next.js 14 register() hook for server/edge
next.config.mjs                — Wrapped with withSentryConfig
.env.local.example             — Added NEXT_PUBLIC_SENTRY_DSN entry
```

---

## Test Results at Merge

- 82/82 tests passing
- `npm run build` succeeded with `withSentryConfig` wrapper
- No TypeScript errors

---

## Next Steps

- Issue #5: Build login and signup pages with TDD
