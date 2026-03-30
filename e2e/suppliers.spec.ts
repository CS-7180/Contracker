/**
 * SUPPLIER PAGES — Playwright E2E
 * Issue #8 [M1.2]
 *
 * Acceptance Criteria covered:
 *   AC-02-1: Member can submit a valid new supplier form → record created in DB
 *   AC-02-2: Member calling DELETE → 403 (covered in auth.test.ts unit tests)
 *   AC-02-3: Admin soft-delete → status=inactive, contracts intact (unit tests)
 *   AC-02-4: Supplier profile page renders all linked contracts
 *
 * Also covers:
 *   - Unauthenticated redirect (middleware, no creds needed)
 *   - List page: heading, buttons, table / empty state, sidebar, dark theme
 *   - Create form: fields, required validation, cancel/back navigation
 *   - Edit form: pre-populated data, save → DB updated
 *   - Navigation flows between supplier pages
 */

import { test, expect } from '@playwright/test'
import fs from 'fs'

const hasAuth = (() => {
  try {
    const state = JSON.parse(fs.readFileSync('e2e/.auth/user.json', 'utf8'))
    return Array.isArray(state.cookies) && state.cookies.length > 0
  } catch {
    return false
  }
})()

// ─── Unauthenticated redirect (middleware) ────────────────────────────────────

test.describe('Suppliers — unauthenticated redirect', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('GET /suppliers redirects to /login', async ({ page }) => {
    await page.goto('/suppliers')
    await expect(page).toHaveURL(/\/login/)
  })

  test('GET /suppliers/new redirects to /login', async ({ page }) => {
    await page.goto('/suppliers/new')
    await expect(page).toHaveURL(/\/login/)
  })
})

// ─── Supplier list page ───────────────────────────────────────────────────────

test.describe('Suppliers list — /suppliers', () => {
  test.skip(!hasAuth, 'E2E_EMAIL not configured — add to .env.test to enable')

  test('renders page heading and New Supplier button', async ({ page }) => {
    await page.goto('/suppliers')

    // Layout adds h1 "Suppliers" in the top bar; page has h2 — target page-level heading
    await expect(page.getByRole('heading', { name: 'Suppliers', level: 2 })).toBeVisible()
    await expect(page.getByRole('link', { name: /new supplier/i })).toBeVisible()
  })

  test('New Supplier button links to /suppliers/new', async ({ page }) => {
    await page.goto('/suppliers')
    const btn = page.getByRole('link', { name: /new supplier/i })
    await expect(btn).toHaveAttribute('href', '/suppliers/new')
  })

  test('shows table headers or empty state — never an error', async ({ page }) => {
    await page.goto('/suppliers')
    const hasTable = await page.locator('thead').isVisible().catch(() => false)
    const hasEmpty = await page.getByText(/no suppliers yet/i).isVisible().catch(() => false)
    expect(hasTable || hasEmpty).toBe(true)
    await expect(page.getByText(/something went wrong/i)).not.toBeVisible()
  })

  test('sidebar and navigation are visible', async ({ page }) => {
    await page.goto('/suppliers')
    await expect(page.locator('aside')).toBeVisible()
    for (const label of ['Dashboard', 'Contracts', 'Suppliers', 'Compliance', 'Spend', 'Notifications']) {
      await expect(page.getByRole('link', { name: label })).toBeVisible()
    }
  })

  test('dark theme applied', async ({ page }) => {
    await page.goto('/suppliers')
    await expect(page.locator('html')).toHaveClass(/\bdark\b/)
  })
})

// ─── Create supplier form — /suppliers/new ────────────────────────────────────

test.describe('Create supplier form — /suppliers/new', () => {
  test.skip(!hasAuth, 'E2E_EMAIL not configured — add to .env.test to enable')

  test('renders all form fields', async ({ page }) => {
    await page.goto('/suppliers/new')
    await expect(page.getByRole('heading', { name: /new supplier/i })).toBeVisible()
    await expect(page.getByLabel(/company name/i)).toBeVisible()
    await expect(page.getByLabel(/contact name/i)).toBeVisible()
    await expect(page.getByLabel(/contact email/i)).toBeVisible()
    await expect(page.getByLabel(/contact phone/i)).toBeVisible()
    await expect(page.getByLabel(/category/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /create supplier/i })).toBeVisible()
  })

  test('Company Name is required — empty submit stays on page', async ({ page }) => {
    await page.goto('/suppliers/new')
    await page.getByLabel(/contact email/i).fill('test@example.com')
    await page.getByRole('button', { name: /create supplier/i }).click()
    await expect(page).toHaveURL(/\/suppliers\/new/)
  })

  test('Cancel button returns to /suppliers', async ({ page }) => {
    await page.goto('/suppliers/new')
    await page.getByRole('link', { name: /cancel/i }).click()
    await expect(page).toHaveURL(/\/suppliers$/)
  })

  test('Back link navigates to /suppliers', async ({ page }) => {
    await page.goto('/suppliers/new')
    await page.getByRole('link', { name: /back to suppliers/i }).click()
    await expect(page).toHaveURL(/\/suppliers$/)
  })
})

// ─── AC-02-1: Happy-path create — form → DB → list ───────────────────────────

test.describe('AC-02-1 — Create supplier happy path', () => {
  test.skip(!hasAuth, 'E2E_EMAIL not configured — add to .env.test to enable')

  let createdSupplierId: string | null = null

  test('fill form → submit → redirect to list → supplier visible (DB written)', async ({ page, request }) => {
    const supplierName = `E2E Supplier ${Date.now()}`

    await page.goto('/suppliers/new')
    await page.getByLabel(/company name/i).fill(supplierName)
    await page.getByLabel(/contact name/i).fill('E2E Contact')
    await page.getByLabel(/contact email/i).fill('e2e-contact@test.com')
    await page.getByLabel(/contact phone/i).fill('617-000-0000')
    await page.getByLabel(/category/i).fill('E2E Testing')
    await page.getByRole('button', { name: /create supplier/i }).click()

    // AC-02-1: redirects to list after success
    await expect(page).toHaveURL(/\/suppliers$/)

    // AC-02-1: supplier is visible in the list (confirms DB row was written)
    await expect(page.getByRole('link', { name: supplierName })).toBeVisible()

    // Save the ID for cleanup
    const res = await request.get('/api/suppliers')
    const body = await res.json()
    const match = body.data?.find((s: { name: string; id: string }) => s.name === supplierName)
    if (match) createdSupplierId = match.id
  })

  test.afterAll(async ({ request }) => {
    if (createdSupplierId) {
      await request.delete(`/api/suppliers/${createdSupplierId}`)
    }
  })
})

// ─── Navigation flow ──────────────────────────────────────────────────────────

test.describe('Supplier navigation flow', () => {
  test.skip(!hasAuth, 'E2E_EMAIL not configured — add to .env.test to enable')

  test('clicking New Supplier navigates to the create form', async ({ page }) => {
    await page.goto('/suppliers')
    await page.getByRole('link', { name: /new supplier/i }).click()
    await expect(page).toHaveURL(/\/suppliers\/new/)
    await expect(page.getByRole('heading', { name: /new supplier/i })).toBeVisible()
  })
})

// ─── AC-02-4: Supplier detail — /suppliers/[id] ──────────────────────────────

test.describe('AC-02-4 — Supplier detail page', () => {
  test.skip(!hasAuth, 'E2E_EMAIL not configured — add to .env.test to enable')

  let supplierId: string

  test.beforeAll(async ({ request }) => {
    const res = await request.post('/api/suppliers', {
      data: {
        name: 'E2E Detail Supplier',
        contact_name: 'Jane E2E',
        contact_email: 'jane@e2e.com',
        contact_phone: '555-E2E',
        category: 'E2E Testing',
      },
    })
    const body = await res.json()
    supplierId = body.data?.id
  })

  test.afterAll(async ({ request }) => {
    if (supplierId) await request.delete(`/api/suppliers/${supplierId}`)
  })

  test('renders supplier name, contact info card, and contracts section (AC-02-4)', async ({ page }) => {
    await page.goto(`/suppliers/${supplierId}`)

    // Heading shows supplier name
    await expect(page.getByRole('heading', { name: 'E2E Detail Supplier', level: 2 })).toBeVisible()

    // Contact information card visible
    await expect(page.getByText(/contact information/i)).toBeVisible()
    await expect(page.getByText('Jane E2E')).toBeVisible()
    await expect(page.getByText('jane@e2e.com')).toBeVisible()

    // Contracts section rendered (AC-02-4 — shows linked contracts list)
    await expect(page.getByText(/contracts \(/i)).toBeVisible()
  })

  test('Edit button links to /suppliers/[id]/edit', async ({ page }) => {
    await page.goto(`/suppliers/${supplierId}`)
    const editLink = page.getByRole('link', { name: /edit/i })
    await expect(editLink).toBeVisible()
    await expect(editLink).toHaveAttribute('href', `/suppliers/${supplierId}/edit`)
  })

  test('unknown id shows 404', async ({ page }) => {
    await page.goto('/suppliers/00000000-0000-0000-0000-000000000000')
    await expect(page).toHaveURL(/\/suppliers\/00000000/)
    // Next.js notFound() renders a 404 page
    await expect(page.getByRole('heading', { name: /404|not found/i })).toBeVisible()
  })
})

// ─── Supplier edit form — /suppliers/[id]/edit ────────────────────────────────

test.describe('Supplier edit form — /suppliers/[id]/edit', () => {
  test.skip(!hasAuth, 'E2E_EMAIL not configured — add to .env.test to enable')

  let supplierId: string

  test.beforeAll(async ({ request }) => {
    const res = await request.post('/api/suppliers', {
      data: {
        name: 'E2E Edit Supplier',
        contact_name: 'Edit Contact',
        category: 'Before Edit',
      },
    })
    const body = await res.json()
    supplierId = body.data?.id
  })

  test.afterAll(async ({ request }) => {
    if (supplierId) await request.delete(`/api/suppliers/${supplierId}`)
  })

  test('renders form pre-populated with existing supplier data', async ({ page }) => {
    await page.goto(`/suppliers/${supplierId}/edit`)

    // Name field pre-populated
    await expect(page.getByLabel(/company name/i)).toHaveValue('E2E Edit Supplier')
    // Contact name pre-populated
    await expect(page.getByLabel(/contact name/i)).toHaveValue('Edit Contact')
  })

  test('Save with empty name stays on form (required field)', async ({ page }) => {
    await page.goto(`/suppliers/${supplierId}/edit`)
    await page.getByLabel(/company name/i).clear()
    await page.getByRole('button', { name: /save changes/i }).click()
    await expect(page).toHaveURL(new RegExp(`/suppliers/${supplierId}/edit`))
  })

  test('Cancel button returns to supplier detail page', async ({ page }) => {
    await page.goto(`/suppliers/${supplierId}/edit`)
    await page.getByRole('link', { name: /cancel/i }).click()
    await expect(page).toHaveURL(new RegExp(`/suppliers/${supplierId}$`))
  })

  test('save updates DB — change is visible on detail page', async ({ page }) => {
    await page.goto(`/suppliers/${supplierId}/edit`)
    await page.getByLabel(/category/i).fill('After Edit')
    await page.getByRole('button', { name: /save changes/i }).click()

    // Redirects to detail page after save
    await expect(page).toHaveURL(new RegExp(`/suppliers/${supplierId}$`))

    // Updated value visible on detail page (confirms DB was written)
    await expect(page.getByText('After Edit')).toBeVisible()
  })
})
