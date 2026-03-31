# Session Log: Issue #18 — Basic Dashboard Page

**Date:** 2026-03-31
**Branch:** `feature/18-dashboard-basic`
**PR:** https://github.com/CS-7180/Contracker/pull/50

## What was done

### RED commit — `test: add failing Playwright E2E tests for dashboard page`
- Created `e2e/dashboard.spec.ts` following the exact pattern from `contracts.spec.ts`
- Added `dashboard-pages` project to `playwright.config.ts`
- Tests that fail on RED:
  - Stat card labels: "Active", "Expiring", "Expired", "Portfolio Value" (current labels were wrong)
  - Stat cards show numeric values via `data-testid` (no testIds on shimmer placeholders)
  - Expiring-soon contract appears in list (only "Coming soon" placeholder shown)
  - Portfolio value card shows `$` formatted amount

### GREEN commit — `feat: connect dashboard page to API with live data`
- Rewrote `app/(app)/dashboard/page.tsx`:
  - Added `useState` + `useEffect` to fetch from `/api/dashboard`
  - Updated `statCards` to use API data: Active / Expiring / Expired / Portfolio Value
  - Added `data-testid` to each stat card value `<p>` element
  - Replaced "Coming soon" section with live "Renewing within 30 days" list
  - Risk colour dot (red/amber/green) + contract name link + renewal date per row
  - Empty state when no contracts renew within 30 days
  - Shimmer shown while loading; real values after fetch completes
  - Removed unused `Building2`, `Sparkles`, `Button` imports; added `XCircle`, `useState`, `useEffect`
  - Framer Motion stagger + `useReducedMotion` gate unchanged

## Test results
- Unit tests: 145/145 pass
- Browser test: Playwright MCP confirmed dashboard shows Active=2, Portfolio Value=$15,000, empty state in expiring-soon
- E2E global-setup is failing (pre-existing issue with `e2e@contracker.dev` headless login timeout) — affects all test suites, not caused by this issue

## Key decisions
- Kept page as `'use client'` (required for `useReducedMotion` hook)
- `statCards` array moved inside component function to access `data` state
- Error state (fetch fails): shows `—` for counts and `—` for portfolio value, falls through to empty expiring-soon state — graceful degradation, no toast needed for MVP
