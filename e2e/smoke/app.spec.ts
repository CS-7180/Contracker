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

      // All sidebar nav links visible
      for (const label of sidebarLinks) {
        await expect(page.getByRole('link', { name: label })).toBeVisible()
      }

      // Page heading matches the route (in the top header bar)
      await expect(page.getByRole('heading', { name: heading, exact: false })).toBeVisible()

      // No error boundary rendered
      await expect(page.getByText(/something went wrong/i)).not.toBeVisible()
    })
  }
})
