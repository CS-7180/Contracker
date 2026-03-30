import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '.env.test') })

export default defineConfig({
  testDir: './e2e',
  globalSetup: require.resolve('./e2e/global-setup'),
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    // Global setup — runs first, creates auth state
    {
      name: 'setup',
      testMatch: /global-setup\.ts/,
    },

    // Unauthenticated smoke tests (login, signup) — no credentials needed
    {
      name: 'auth-pages',
      testMatch: /smoke\/auth\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },

    // Authenticated smoke tests — depends on setup completing first
    {
      name: 'app-pages',
      testMatch: /smoke\/app\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    // Supplier page tests (authenticated + unauthenticated redirect)
    {
      name: 'supplier-pages',
      testMatch: /suppliers\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    // Contract page tests (authenticated + unauthenticated redirect)
    {
      name: 'contract-pages',
      testMatch: /contracts\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],

  // Automatically start the Next.js dev server
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
})
