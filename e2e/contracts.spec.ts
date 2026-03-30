/**
 * CONTRACT PAGES — Playwright E2E
 * Issue #10 [M1.3]
 *
 * Acceptance Criteria covered:
 *   AC-03-1: Valid form submission creates a DB record with all submitted fields
 *   AC-03-2: renewal_date within notice_period_days → status = 'expiring' (unit tests)
 *   AC-03-3: end_date in the past → status = 'expired' (unit tests)
 *   AC-03-6: Member calling DELETE → 403 (unit tests)
 *
 * Also covers:
 *   - Unauthenticated redirect (middleware, no creds needed)
 *   - Create form: fields, required validation, date validation, cancel/back navigation
 *   - Happy-path: fill form → submit → redirect to /contracts/[id] → DB confirmed
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
