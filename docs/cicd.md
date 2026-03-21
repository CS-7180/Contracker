# CI/CD Pipeline Reference

## Branch Strategy

```
main          → production (auto-deploys to Vercel)
feature/*     → feature branches (PR into main)
fix/*         → bug fixes
chore/*       → non-functional changes
```

**Branch naming:** `feature/[issue-number]-short-description`

Examples: `feature/42-contract-crud`, `fix/53-renewal-date-off-by-one`

## PR Workflow

Every PR triggers GitHub Actions CI:

1. **Lint** — ESLint + TypeScript type check
2. **Test** — Vitest unit + integration tests
3. **Build** — `next build` (catches build-time errors)
4. **E2E** — Playwright tests (Sprint 2+)
5. **Perf Gate** — Lighthouse CI (warning Sprint 1–2, blocking Sprint 3)

**Required to merge:** all lint/test/build checks pass + LCP ≤ 2.5s, CLS ≤ 0.1

## Deployment

| Event | Target | Behaviour |
|---|---|---|
| PR opened/updated | Vercel Preview URL | Auto-deployed, unique URL per PR |
| Merge to `main` | Vercel Production | Auto-deploys, zero downtime |
| Rollback needed | Vercel Dashboard | One-click rollback |

## Common Tasks

### Adding a New API Route
1. Write tests first (TDD red commit)
2. Create route handler in `app/api/[resource]/route.ts`
3. Authenticate → check role (if admin-only) → validate with Zod → query DB → return `{ data, error }`
4. Implement to pass tests (TDD green commit)
5. Refactor if needed

### Adding a New Pure Function
1. Write tests first in `__tests__/lib/[module].test.ts` (red commit)
2. Implement in `lib/[module].ts` with explicit return type (green commit)
3. Inject `today` as optional param for deterministic testing
4. Refactor if needed

### Useful Commands
```bash
npm test -- risk.test.ts          # Run single test file

# Debug Supabase queries
const { data } = await supabase.from('contracts').select('*')
  .explain({ analyze: true, verbose: true })
```

## Sprint Handoff

**Sprint 1 → Sprint 2 (Raj → Vineela):**
- Raj merges `feature/[n]-risk-lib` with all `lib/risk.ts` tests passing
- Vineela builds traffic-light dashboard UI on top
- No API work needed from Vineela in Sprint 2 — all endpoints already exist

**Handoff condition:** `getContractStatus()` and `getRiskColour()` fully tested and merged to main.
