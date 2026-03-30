# Playwright UI Testing Protocol

**Every issue labelled `ui` must include Playwright E2E tests before the PR is opened.**

## What to cover on every UI feature

| Check | What to assert |
|---|---|
| Unauthenticated redirect | Navigate without session → redirected to `/login` (tests middleware) |
| Page renders | Heading (use `level: 2` — layout also renders `h1`), key buttons/links, no error boundary |
| Dark theme | `expect(page.locator('html')).toHaveClass(/\bdark\b/)` |
| Sidebar navigation | All 6 nav links visible on every authenticated page |
| Acceptance Criteria | Each AC in the GitHub issue maps to at least one Playwright assertion |
| Form validation | Empty required field → submit → still on same URL |
| Happy-path submission | Fill valid data → submit → assert redirect AND DB row visible |
| DB side-effects | After create/update/delete, re-navigate or query Supabase to confirm the change persisted |
| Navigation flows | Back buttons, cancel links, breadcrumbs navigate to correct URLs |
| Empty state | When no data exists, assert empty-state UI — not a blank page, not an error |

## Test structure template

```typescript
// Unauthenticated — no session needed
test.describe('Feature — unauthenticated redirect', () => {
  test.use({ storageState: { cookies: [], origins: [] } })
  test('GET /page → /login', async ({ page }) => { ... })
})

// Authenticated — skip when E2E_EMAIL not set in .env.test
test.describe('Feature — authenticated', () => {
  test.skip(!hasAuth, 'E2E_EMAIL not configured — add to .env.test')
  test('renders heading and key elements', async ({ page }) => { ... })
  test('happy path: submit → redirects → data visible', async ({ page }) => { ... })
})

// Needs seed data — mark fixme until ready
test.describe('Detail/edit', () => {
  test.fixme('renders pre-populated data', async () => {})
})
```

## Browser testing requirement

**Before committing any UI feature, open the browser and manually test the happy path using Playwright MCP browser tools.**

Do not rely solely on unit tests or E2E spec files. A passing test suite does not guarantee the form actually works end-to-end in a real browser.

### Mandatory pre-commit browser checklist
1. Start the dev server (`npm run dev`)
2. Log in via the browser (`mcp__playwright__browser_navigate` → fill credentials → sign in)
3. Navigate to the feature page
4. Test the **happy path** — fill valid data, submit, confirm redirect and DB row created
5. Test at least one **error path** — empty required field, invalid input
6. Only commit once both pass in the browser

This is in addition to (not instead of) the Playwright E2E spec tests.

## Gotchas
- **Heading selector** — layout renders `<h1>PageName</h1>` in the top bar AND page has `<h2>`. Always use `getByRole('heading', { name: '...', level: 2 })`.
- **No `test.todo()` inside describe** — throws in Playwright 1.x. Use `test.fixme()` instead.
- **Each feature area gets its own project** in `playwright.config.ts` with `storageState` and `dependencies: ['setup']`.
- **E2E test user** — `e2e@contracker.dev` (role: admin) in Supabase. Add `E2E_EMAIL` + `E2E_PASSWORD` to `.env.test` to run authenticated tests.
