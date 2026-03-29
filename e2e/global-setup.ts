import { chromium } from '@playwright/test'
import fs from 'fs'
import path from 'path'

const AUTH_FILE = 'e2e/.auth/user.json'

export default async function globalSetup() {
  const email = process.env.E2E_EMAIL
  const password = process.env.E2E_PASSWORD

  // Ensure the auth directory exists
  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true })

  if (!email || !password) {
    // No credentials — write empty state; app page tests will skip themselves
    fs.writeFileSync(AUTH_FILE, JSON.stringify({ cookies: [], origins: [] }))
    console.log('[setup] E2E_EMAIL not set in .env.test — app page smoke tests will be skipped')
    return
  }

  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()

  await page.goto('http://localhost:3000/login')
  await page.getByLabel(/email/i).fill(email)
  await page.getByLabel(/^password$/i).fill(password)
  await page.getByRole('button', { name: /sign in/i }).click()
  await page.waitForURL('**/dashboard', { timeout: 15_000 })

  await context.storageState({ path: AUTH_FILE })
  await browser.close()

  console.log('[setup] Signed in and saved auth state →', AUTH_FILE)
}
