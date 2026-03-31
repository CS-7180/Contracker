/**
 * CONTRACT PAGES — Playwright E2E
 * Issue #10 [M1.3] — contract create form
 * Issue #11 [M1.3] — PDF upload
 * Issue #12 [M1.3] — contract detail and edit pages
 *
 * Acceptance Criteria covered:
 *   AC-03-1: Valid form submission creates a DB record with all submitted fields
 *   AC-03-4: PDF under 10MB uploaded → pdf_url stored and accessible
 *   AC-03-5: Non-PDF file upload → rejected with error message
 *   AC-03-2: renewal_date within notice_period_days → status = 'expiring' (unit tests)
 *   AC-03-3: end_date in the past → status = 'expired' (unit tests)
 *   AC-03-6: Member calling DELETE → 403 (unit tests)
 *
 * Also covers:
 *   - Unauthenticated redirect (middleware, no creds needed)
 *   - Create form: fields, required validation, date validation, cancel/back navigation
 *   - Happy-path: fill form → submit → redirect to /contracts/[id] → DB confirmed
 *   - Detail page: renders contract fields, status badge, supplier link, edit/delete buttons
 *   - Edit page: pre-populated form, PUT on submit, cancel navigates back
 */

import { test, expect } from '@playwright/test'
import fs from 'fs'
import path from 'path'

const hasAuth = (() => {
  try {
    const state = JSON.parse(fs.readFileSync('e2e/.auth/user.json', 'utf8'))
    return Array.isArray(state.cookies) && state.cookies.length > 0
  } catch {
    return false
  }
})()

// ─── Unauthenticated redirect (middleware) ────────────────────────────────────

test.describe('Contracts — unauthenticated redirect', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('GET /contracts/new redirects to /login', async ({ page }) => {
    await page.goto('/contracts/new')
    await expect(page).toHaveURL(/\/login/)
  })
})

// ─── Create contract form — /contracts/new ────────────────────────────────────

test.describe('Create contract form — /contracts/new', () => {
  test.skip(!hasAuth, 'E2E_EMAIL not configured — add to .env.test to enable')

  test('renders heading and key form fields', async ({ page }) => {
    await page.goto('/contracts/new')

    // Layout adds h1 in top bar; page renders h2 — target page-level heading
    await expect(page.getByRole('heading', { name: /new contract/i, level: 2 })).toBeVisible()
    await expect(page.getByLabel(/contract name/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /create contract/i })).toBeVisible()
  })

  test('dark theme applied', async ({ page }) => {
    await page.goto('/contracts/new')
    await expect(page.locator('html')).toHaveClass(/\bdark\b/)
  })

  test('sidebar navigation is visible', async ({ page }) => {
    await page.goto('/contracts/new')
    const sidebar = page.locator('aside')
    await expect(sidebar).toBeVisible()
    for (const label of ['Dashboard', 'Contracts', 'Suppliers', 'Compliance', 'Spend', 'Notifications']) {
      await expect(sidebar.getByRole('link', { name: label, exact: true })).toBeVisible()
    }
  })

  test('Contract Name is required — empty submit stays on page', async ({ page }) => {
    await page.goto('/contracts/new')
    await page.getByRole('button', { name: /create contract/i }).click()
    await expect(page).toHaveURL(/\/contracts\/new/)
  })

  test('Cancel button returns to /contracts', async ({ page }) => {
    await page.goto('/contracts/new')
    await page.getByRole('link', { name: /cancel/i }).click()
    await expect(page).toHaveURL(/\/contracts$/)
  })

  test('Back link navigates to /contracts', async ({ page }) => {
    await page.goto('/contracts/new')
    await page.getByRole('link', { name: /back to contracts/i }).click()
    await expect(page).toHaveURL(/\/contracts$/)
  })
})

// ─── AC-03-1: Happy-path create — form → DB ──────────────────────────────────

test.describe('AC-03-1 — Create contract happy path', () => {
  test.skip(!hasAuth, 'E2E_EMAIL not configured — add to .env.test to enable')

  let supplierId: string
  let createdContractId: string | null = null

  test.beforeAll(async ({ request }) => {
    const res = await request.post('/api/suppliers', {
      data: {
        name: 'E2E Contract Supplier',
        category: 'E2E Testing',
      },
    })
    const body = await res.json()
    supplierId = body.data?.id
  })

  test.afterAll(async ({ request }) => {
    if (createdContractId) {
      await request.delete(`/api/contracts/${createdContractId}`)
    }
    if (supplierId) {
      await request.delete(`/api/suppliers/${supplierId}`)
    }
  })

  test('fill form → submit → redirect to /contracts/[id] → contract in DB (AC-03-1)', async ({ page, request }) => {
    const contractName = `E2E Contract ${Date.now()}`

    await page.goto('/contracts/new')

    // Fill required fields
    await page.getByLabel(/contract name/i).fill(contractName)

    // Select contract type
    await page.getByRole('combobox', { name: /contract type/i }).click()
    await page.getByRole('option', { name: /service/i }).click()

    // Select supplier
    await page.getByRole('combobox', { name: /supplier/i }).click()
    await page.getByRole('option', { name: 'E2E Contract Supplier' }).click()

    // Fill dates
    await page.getByLabel(/start date/i).fill('2025-01-01')
    await page.getByLabel(/end date/i).fill('2026-01-01')
    await page.getByLabel(/renewal date/i).fill('2025-10-01')

    await page.getByRole('button', { name: /create contract/i }).click()

    // AC-03-1: redirects to /contracts/[id] on success
    await expect(page).toHaveURL(/\/contracts\/[0-9a-f-]+$/)

    // Save contract ID for cleanup
    const url = page.url()
    const match = url.match(/\/contracts\/([0-9a-f-]+)$/)
    if (match) createdContractId = match[1]

    // Verify DB record exists via API
    const res = await request.get('/api/contracts')
    const body = await res.json()
    const found = body.data?.find((c: { name: string }) => c.name === contractName)
    expect(found).toBeDefined()
  })
})

// ─── Client-side date validation ──────────────────────────────────────────────

test.describe('Client-side date validation', () => {
  test.skip(!hasAuth, 'E2E_EMAIL not configured — add to .env.test to enable')

  test('end_date before start_date shows error and stays on page', async ({ page }) => {
    await page.goto('/contracts/new')
    await page.getByLabel(/contract name/i).fill('Date Validation Test')
    await page.getByLabel(/start date/i).fill('2025-06-01')
    await page.getByLabel(/end date/i).fill('2025-01-01')
    await page.getByLabel(/renewal date/i).fill('2024-12-01')
    await page.getByRole('button', { name: /create contract/i }).click()
    await expect(page).toHaveURL(/\/contracts\/new/)
    await expect(page.getByText(/end date must be on or after start date/i)).toBeVisible()
  })

  test('renewal_date after end_date shows error and stays on page', async ({ page }) => {
    await page.goto('/contracts/new')
    await page.getByLabel(/contract name/i).fill('Date Validation Test')
    await page.getByLabel(/start date/i).fill('2025-01-01')
    await page.getByLabel(/end date/i).fill('2025-06-01')
    await page.getByLabel(/renewal date/i).fill('2026-01-01')
    await page.getByRole('button', { name: /create contract/i }).click()
    await expect(page).toHaveURL(/\/contracts\/new/)
    await expect(page.getByText(/renewal date must be on or before end date/i)).toBeVisible()
  })
})

// ─── PDF upload — AC-03-4 and AC-03-5 ────────────────────────────────────────

test.describe('PDF upload — AC-03-4 (valid PDF)', () => {
  test.skip(!hasAuth, 'E2E_EMAIL not configured — add to .env.test to enable')

  let supplierId: string
  let createdContractId: string | null = null

  test.beforeAll(async ({ request }) => {
    const res = await request.post('/api/suppliers', {
      data: { name: 'E2E PDF Upload Supplier', category: 'E2E Testing' },
    })
    const body = await res.json()
    supplierId = body.data?.id
  })

  test.afterAll(async ({ request }) => {
    if (createdContractId) {
      await request.delete(`/api/contracts/${createdContractId}`)
    }
    if (supplierId) {
      await request.delete(`/api/suppliers/${supplierId}`)
    }
  })

  test('attach PDF → submit → contract has pdf_url set in DB (AC-03-4)', async ({ page, request }) => {
    const contractName = `E2E PDF Contract ${Date.now()}`
    const pdfFixture = path.resolve('e2e/fixtures/test.pdf')

    await page.goto('/contracts/new')

    await page.getByLabel(/contract name/i).fill(contractName)
    await page.getByRole('combobox', { name: /contract type/i }).click()
    await page.getByRole('option', { name: /service/i }).click()
    await page.getByRole('combobox', { name: /supplier/i }).click()
    await page.getByRole('option', { name: 'E2E PDF Upload Supplier' }).click()
    await page.getByLabel(/start date/i).fill('2025-01-01')
    await page.getByLabel(/end date/i).fill('2026-01-01')
    await page.getByLabel(/renewal date/i).fill('2025-10-01')

    // Attach the PDF fixture
    await page.getByLabel(/contract pdf/i).setInputFiles(pdfFixture)

    await page.getByRole('button', { name: /create contract/i }).click()

    // Should redirect to the contract detail page
    await expect(page).toHaveURL(/\/contracts\/[0-9a-f-]+$/, { timeout: 10000 })

    // Save ID for cleanup
    const url = page.url()
    const match = url.match(/\/contracts\/([0-9a-f-]+)$/)
    if (match) createdContractId = match[1]

    // Verify pdf_url is stored via API
    const res = await request.get('/api/contracts')
    const body = await res.json()
    const found = body.data?.find((c: { name: string; pdf_url: string | null }) => c.name === contractName)
    expect(found).toBeDefined()
    expect(found.pdf_url).not.toBeNull()
  })
})

test.describe('PDF upload — AC-03-5 (non-PDF rejected)', () => {
  test.skip(!hasAuth, 'E2E_EMAIL not configured — add to .env.test to enable')

  test('attach non-PDF file → client error shown, stays on page (AC-03-5)', async ({ page }) => {
    await page.goto('/contracts/new')

    // Create a .txt file buffer in memory and set it as a file upload
    await page.getByLabel(/contract pdf/i).setInputFiles({
      name: 'document.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('not a pdf'),
    })

    // Client-side validation should reject immediately — error visible without submitting
    await expect(page.getByText(/only pdf files/i)).toBeVisible()
    await expect(page).toHaveURL(/\/contracts\/new/)
  })

  test('attach file over 10 MB → client error shown, stays on page', async ({ page }) => {
    await page.goto('/contracts/new')

    // Create a 11 MB in-memory "PDF" (MIME = pdf but oversized)
    const bigBuffer = Buffer.alloc(11 * 1024 * 1024, 0)
    await page.getByLabel(/contract pdf/i).setInputFiles({
      name: 'big.pdf',
      mimeType: 'application/pdf',
      buffer: bigBuffer,
    })

    await expect(page.getByText(/exceeds the 10 mb size limit/i)).toBeVisible()
    await expect(page).toHaveURL(/\/contracts\/new/)
  })
})

// ─── Contract detail page — unauthenticated redirect ─────────────────────────
// Issue #12 [M1.3]

test.describe('Contract detail — unauthenticated redirect', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('GET /contracts/[id] redirects to /login', async ({ page }) => {
    await page.goto('/contracts/00000000-0000-0000-0000-000000000000')
    await expect(page).toHaveURL(/\/login/)
  })
})

// ─── Contract edit page — unauthenticated redirect ───────────────────────────

test.describe('Contract edit — unauthenticated redirect', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('GET /contracts/[id]/edit redirects to /login', async ({ page }) => {
    await page.goto('/contracts/00000000-0000-0000-0000-000000000000/edit')
    await expect(page).toHaveURL(/\/login/)
  })
})

// ─── Contract detail page — authenticated ────────────────────────────────────
// Issue #12 — AC: detail shows name, supplier, type, dates, value, status badge

test.describe('Contract detail page — /contracts/[id]', () => {
  test.skip(!hasAuth, 'E2E_EMAIL not configured — add to .env.test to enable')

  let supplierId: string
  let contractId: string

  test.beforeAll(async ({ request }) => {
    // Create supplier
    const sRes = await request.post('/api/suppliers', {
      data: { name: 'E2E Detail Supplier', category: 'E2E Testing' },
    })
    supplierId = (await sRes.json()).data?.id

    // Create contract
    const cRes = await request.post('/api/contracts', {
      data: {
        name: 'E2E Detail Contract',
        type: 'service',
        supplier_id: supplierId,
        start_date: '2025-01-01',
        end_date: '2027-01-01',
        renewal_date: '2026-10-01',
        notice_period_days: 30,
        value: 12000,
        category: 'Technology',
      },
    })
    contractId = (await cRes.json()).data?.id
  })

  test.afterAll(async ({ request }) => {
    if (contractId) await request.delete(`/api/contracts/${contractId}`)
    if (supplierId) await request.delete(`/api/suppliers/${supplierId}`)
  })

  test('renders page heading with contract name', async ({ page }) => {
    await page.goto(`/contracts/${contractId}`)
    await expect(page.getByRole('heading', { name: /e2e detail contract/i, level: 2 })).toBeVisible()
  })

  test('dark theme applied', async ({ page }) => {
    await page.goto(`/contracts/${contractId}`)
    await expect(page.locator('html')).toHaveClass(/\bdark\b/)
  })

  test('sidebar navigation is visible', async ({ page }) => {
    await page.goto(`/contracts/${contractId}`)
    const sidebar = page.locator('aside')
    await expect(sidebar).toBeVisible()
    for (const label of ['Dashboard', 'Contracts', 'Suppliers', 'Compliance', 'Spend', 'Notifications']) {
      await expect(sidebar.getByRole('link', { name: label, exact: true })).toBeVisible()
    }
  })

  test('shows supplier name on detail page', async ({ page }) => {
    await page.goto(`/contracts/${contractId}`)
    await expect(page.getByText(/e2e detail supplier/i)).toBeVisible()
  })

  test('shows status badge (active/expiring/expired)', async ({ page }) => {
    await page.goto(`/contracts/${contractId}`)
    // Status badge should show one of the computed statuses
    await expect(page.getByText(/active|expiring|expired/i)).toBeVisible()
  })

  test('Edit button links to /contracts/[id]/edit', async ({ page }) => {
    await page.goto(`/contracts/${contractId}`)
    const editLink = page.getByRole('link', { name: /edit/i })
    await expect(editLink).toBeVisible()
    await editLink.click()
    await expect(page).toHaveURL(new RegExp(`/contracts/${contractId}/edit`))
  })

  test('Back link navigates to /contracts', async ({ page }) => {
    await page.goto(`/contracts/${contractId}`)
    await page.getByRole('link', { name: /back to contracts/i }).click()
    await expect(page).toHaveURL(/\/contracts$/)
  })
})

// ─── Contract edit page — authenticated ──────────────────────────────────────
// Issue #12 — AC: edit form pre-fills all existing values, PUT → redirect to detail

test.describe('Contract edit page — /contracts/[id]/edit', () => {
  test.skip(!hasAuth, 'E2E_EMAIL not configured — add to .env.test to enable')

  let supplierId: string
  let contractId: string

  test.beforeAll(async ({ request }) => {
    const sRes = await request.post('/api/suppliers', {
      data: { name: 'E2E Edit Supplier', category: 'E2E Testing' },
    })
    supplierId = (await sRes.json()).data?.id

    const cRes = await request.post('/api/contracts', {
      data: {
        name: 'E2E Edit Contract',
        type: 'service',
        supplier_id: supplierId,
        start_date: '2025-01-01',
        end_date: '2027-01-01',
        renewal_date: '2026-10-01',
        notice_period_days: 30,
        value: 5000,
      },
    })
    contractId = (await cRes.json()).data?.id
  })

  test.afterAll(async ({ request }) => {
    if (contractId) await request.delete(`/api/contracts/${contractId}`)
    if (supplierId) await request.delete(`/api/suppliers/${supplierId}`)
  })

  test('renders edit page heading', async ({ page }) => {
    await page.goto(`/contracts/${contractId}/edit`)
    await expect(page.getByRole('heading', { name: /edit contract/i, level: 2 })).toBeVisible()
  })

  test('pre-populates contract name field with existing value', async ({ page }) => {
    await page.goto(`/contracts/${contractId}/edit`)
    const nameInput = page.getByLabel(/contract name/i)
    await expect(nameInput).toBeVisible()
    await expect(nameInput).toHaveValue(/e2e edit contract/i)
  })

  test('Contract Name required — empty submit stays on page', async ({ page }) => {
    await page.goto(`/contracts/${contractId}/edit`)
    // Wait for pre-fill
    await page.getByLabel(/contract name/i).waitFor()
    await page.getByLabel(/contract name/i).fill('')
    await page.getByRole('button', { name: /save changes/i }).click()
    await expect(page).toHaveURL(new RegExp(`/contracts/${contractId}/edit`))
  })

  test('valid edit → submit → redirects to detail page (AC)', async ({ page, request }) => {
    await page.goto(`/contracts/${contractId}/edit`)
    // Wait for the specific pre-filled value to confirm useEffect has settled
    const nameInput = page.getByLabel(/contract name/i)
    await expect(nameInput).toHaveValue('E2E Edit Contract')
    await nameInput.fill('E2E Edit Contract Updated')
    // Confirm React state updated before submitting
    await expect(nameInput).toHaveValue('E2E Edit Contract Updated')

    await page.getByRole('button', { name: /save changes/i }).click()

    // Should redirect back to detail page
    await expect(page).toHaveURL(new RegExp(`/contracts/${contractId}$`), { timeout: 10000 })

    // Verify DB record updated via API
    const res = await request.get(`/api/contracts/${contractId}`)
    const body = await res.json()
    expect(body.data.name).toBe('E2E Edit Contract Updated')
  })

  test('Cancel button navigates back to detail page', async ({ page }) => {
    await page.goto(`/contracts/${contractId}/edit`)
    await page.getByRole('link', { name: /cancel/i }).click()
    await expect(page).toHaveURL(new RegExp(`/contracts/${contractId}$`))
  })
})
