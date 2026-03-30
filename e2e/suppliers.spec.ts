/**
 * SUPPLIER PAGES — Playwright E2E
 * Issue #8 [M1.2]
 *
 * Covers:
 *   - Unauthenticated redirect (middleware, no creds needed)
 *   - /suppliers list: heading, buttons, table / empty state
 *   - /suppliers/new: form fields, required validation, cancel nav
 *   - Navigation between supplier pages
 *
 * Authenticated tests skip gracefully when E2E_EMAIL is not set in .env.test
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
// These tests override the project storageState to run without a session.
// They verify the middleware auth gate (issue #6) works for supplier routes.

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

    // Layout adds h1 "Suppliers" in the top bar; page has h2 — target the page-level heading
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

    // Either a table with headers is shown, or an empty state message
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

    // Leave name empty, fill optional field so submit is attempted
    await page.getByLabel(/contact email/i).fill('test@example.com')
    await page.getByRole('button', { name: /create supplier/i }).click()

    // Should still be on /suppliers/new — required validation prevents navigation
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

// ─── Detail and edit pages (requires seeded data) ────────────────────────────
// These tests need a real supplier in the DB — implement when seed data is set up.

test.describe('Supplier detail — /suppliers/[id]', () => {
  test.fixme('renders supplier name, contact info card, and linked contracts table', async () => {})
  test.fixme('Edit button links to /suppliers/[id]/edit', async () => {})
  test.fixme('unknown id shows 404 page', async () => {})
})

test.describe('Supplier edit form — /suppliers/[id]/edit', () => {
  test.fixme('renders form pre-populated with existing supplier data', async () => {})
  test.fixme('Cancel button returns to supplier detail page', async () => {})
  test.fixme('Save with empty name stays on form (required field)', async () => {})
})
