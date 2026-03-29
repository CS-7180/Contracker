import { test, expect } from '@playwright/test'

test.describe('Auth pages smoke — dark theme + visibility', () => {

  test('login page: dark theme and form elements visible', async ({ page }) => {
    await page.goto('/login')

    // Primary regression guard: dark class must be on <html>
    // If someone removes className="dark" from app/layout.tsx, this fails immediately
    await expect(page.locator('html')).toHaveClass(/\bdark\b/)

    // Heading visible (not white-on-white / invisible)
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()

    // Form labels and inputs readable
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/^password$/i)).toBeVisible()

    // CTA button rendered
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()

    // Navigation link to signup present
    await expect(page.getByRole('link', { name: /sign up/i })).toBeVisible()

    // No crash / error overlay
    await expect(page.getByText(/something went wrong/i)).not.toBeVisible()
  })

  test('signup page: dark theme and form elements visible', async ({ page }) => {
    await page.goto('/signup')

    await expect(page.locator('html')).toHaveClass(/\bdark\b/)
    await expect(page.getByRole('heading', { name: /create an account/i })).toBeVisible()
    await expect(page.getByLabel(/full name/i)).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/^password$/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /sign up/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible()
    await expect(page.getByText(/something went wrong/i)).not.toBeVisible()
  })

  test('root "/" redirects to /login', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/login/)
  })

  test('unauthenticated /dashboard redirects to /login', async ({ page }) => {
    // Skip until middleware auth gate is implemented — Issue #6 (M1.1)
    test.skip(true, 'Middleware auth gate not yet implemented — enable in Issue #6')
  })
})
