import { test, expect } from '@playwright/test'
import fs from 'fs'

// Skip the entire suite if no auth session was configured in global setup.
// To enable: add E2E_EMAIL and E2E_PASSWORD to .env.test and create the
// corresponding user in your Supabase project.
const hasAuth = (() => {
  try {
    const state = JSON.parse(fs.readFileSync('e2e/.auth/user.json', 'utf8'))
    return Array.isArray(state.cookies) && state.cookies.length > 0
  } catch {
    return false
  }
})()

const appRoutes = [
  { path: '/dashboard',     heading: 'Dashboard' },
  { path: '/contracts',     heading: 'Contracts' },
  { path: '/suppliers',     heading: 'Suppliers' },
  { path: '/compliance',    heading: 'Compliance' },
  { path: '/spend',         heading: 'Spend' },
  { path: '/notifications', heading: 'Notifications' },
]

const sidebarLinks = ['Dashboard', 'Contracts', 'Suppliers', 'Compliance', 'Spend', 'Notifications']

test.describe('App pages smoke — dark theme + layout', () => {
  test.skip(!hasAuth, 'E2E_EMAIL not configured — add to .env.test to enable authenticated smoke tests')

  for (const { path, heading } of appRoutes) {
    test(`${heading} page: dark theme, sidebar, heading visible`, async ({ page }) => {
      await page.goto(path)

      // Primary regression guard: dark class on <html>
      await expect(page.locator('html')).toHaveClass(/\bdark\b/)

      // Sidebar must be present and visible (not collapsed, not white)
      await expect(page.locator('aside')).toBeVisible()

      // All sidebar nav links visible (scoped to aside + exact match to avoid strict-mode
      // violations when page content contains links whose accessible name includes a nav label,
      // e.g. a supplier named "E2E Dashboard Supplier")
      const sidebar = page.locator('aside')
      for (const label of sidebarLinks) {
        await expect(sidebar.getByRole('link', { name: label, exact: true })).toBeVisible()
      }

      // Page heading matches the route — scoped to <header> to avoid strict-mode violations
      // caused by pages that also have an h2 (or h1) containing the same route name
      // (e.g. Contracts page: layout h1="Contracts" AND page h2="Contracts").
      await expect(page.locator('header').getByRole('heading', { name: heading, level: 1, exact: true })).toBeVisible()

      // No error boundary rendered
      await expect(page.getByText(/something went wrong/i)).not.toBeVisible()
    })
  }
})
