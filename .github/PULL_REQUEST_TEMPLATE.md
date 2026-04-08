## What & Why
<!-- One sentence: what this PR changes and the GitHub issue it closes -->
Closes #

---

## C.L.E.A.R. Review

- **Context:** <!-- What does this PR do and why does it matter? Link to the relevant sprint milestone. -->
- **Logic:** <!-- What were the key implementation decisions? Why this approach over alternatives? -->
- **Edge cases:** <!-- What could go wrong? What was explicitly handled? What is out of scope? -->
- **Assertions:** <!-- What do the tests verify? Link the test file(s). -->
- **Risks:** <!-- Anything that could break in production or needs monitoring after merge? -->

---

## AI Disclosure

- **Tool:** Claude Code (claude-sonnet-4-6)
- **% AI-generated:** ~__%
- **Human review:** <!-- What did you manually verify, test, or change? -->

---

## Checklist

### TDD
- [ ] `test:` commit exists on this branch BEFORE any `feat:` commit for new logic
- [ ] All new pure functions have unit tests in `__tests__/lib/`
- [ ] All new API routes have tests in `__tests__/api/`
- [ ] `npm test` passes locally

### Code Quality
- [ ] `npm run type-check` passes with no errors
- [ ] `npm run lint` passes with no errors
- [ ] No `console.log` left in committed code
- [ ] All new `lib/` functions have explicit TypeScript return type annotations

### Security
- [ ] Zod schema defined at module top-level for every new POST/PUT route
- [ ] `supabase.auth.getUser()` called in every new API handler
- [ ] Admin role check added for any DELETE or `/api/team/*` handler
- [ ] No server-only secrets (`SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`) referenced in client files

### Playwright (UI issues only)
- [ ] Unauthenticated redirect test added
- [ ] Happy-path browser test passed manually via Playwright MCP
- [ ] At least one error-path test added (empty required field, invalid input)
