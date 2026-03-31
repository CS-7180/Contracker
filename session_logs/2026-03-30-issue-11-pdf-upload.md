# Session Log — Issue #11: PDF Upload to Supabase Storage

**Date:** 2026-03-30
**Branch:** `feature/11-pdf-upload`
**PR:** CS-7180/Contracker#45

## What was done

### Context
Issue #10 (contract create form + POST API) was already closed when this session started. Issue #11 was the next open issue — adding PDF upload to contracts.

### Design decision: two-step upload
Rather than switching the existing JSON-based POST to multipart (which would break 8 passing unit tests and require significant refactoring), PDF upload was implemented as a separate endpoint:
1. Form submits JSON → `POST /api/contracts` → gets contract `id`
2. If file selected → `POST /api/contracts/[id]/upload` (FormData) → updates `pdf_url`

This kept all existing tests intact and made the upload independently testable.

### Storage path vs signed URL
The issue description said "store signed URL in `pdf_url`", but issue #12 (contract detail page) says "fresh signed URL on each page load". Resolved by storing the **storage path** (`uuid.pdf`) in `pdf_url`, not the signed URL. Detail page (#12) will generate a fresh signed URL from this path.

### Test environment gotcha
`new Request(url, { body: formData })` with a real `File` object causes `req.formData()` to hang indefinitely in the Vitest/Node.js test environment (multipart streaming issue). Fixed by mocking `req.formData()` directly on the request object.

## Commits

1. `test: add failing tests for POST /api/contracts/[id]/upload (RED)` — 5 planned tests, suite fails (route not found)
2. `feat: create contract-pdfs bucket and implement upload route (GREEN)` — migration + route, 14/14 pass
3. `test: add Playwright E2E tests for PDF upload (RED)` — AC-03-4, AC-03-5, oversized file
4. `feat: add PDF file input to contract create form (GREEN)` — file input, client validation, two-step submit

## Files changed

- `__tests__/api/contracts.test.ts` — added 5 upload tests
- `supabase/migrations/20260330144747_contract_pdfs_bucket.sql` — bucket + RLS
- `app/api/contracts/[id]/upload/route.ts` — new upload endpoint
- `e2e/contracts.spec.ts` — added AC-03-4, AC-03-5, oversized file tests
- `e2e/fixtures/test.pdf` — minimal valid PDF fixture
- `app/(app)/contracts/new/page.tsx` — file input + two-step submit logic
