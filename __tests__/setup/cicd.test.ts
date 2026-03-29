/**
 * CICD CONFIGURATION TESTS
 *
 * Verifies that all CI/CD configuration for Issue #3 is correctly in place:
 * GitHub Actions workflows (ci.yml, deploy.yml), Vercel config, required
 * package.json scripts, and .env.local.example security.
 *
 * TDD RED  🔴 — security tests FAIL until .env.local.example is sanitized.
 * TDD GREEN 🟢 — already satisfied by existing workflow files.
 *
 * Run with: npm test -- cicd.test
 */

import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

const ROOT = process.cwd()

// ─────────────────────────────────────────────────────────
// CI WORKFLOW                                            🟢
// ─────────────────────────────────────────────────────────
describe('CI Workflow (.github/workflows/ci.yml)', () => {
  const CI_YML = join(ROOT, '.github', 'workflows', 'ci.yml')

  it('🟢 .github/workflows/ci.yml file exists', () => {
    expect(
      existsSync(CI_YML),
      '.github/workflows/ci.yml is missing — CI pipeline not configured'
    ).toBe(true)
  })

  it('🟢 ci.yml triggers on pull_request to main', () => {
    const source = readFileSync(CI_YML, 'utf-8')
    expect(
      source,
      'ci.yml must trigger on pull_request — add: on: pull_request: branches: [main]'
    ).toContain('pull_request')
  })

  it('🟢 ci.yml triggers on push to main', () => {
    const source = readFileSync(CI_YML, 'utf-8')
    expect(
      source,
      'ci.yml must trigger on push to main — add: on: push: branches: [main]'
    ).toContain('push')
  })

  it('🟢 ci.yml defines a lint job that runs npm run lint and npm run type-check', () => {
    const source = readFileSync(CI_YML, 'utf-8')
    expect(source, 'ci.yml lint job must run npm run lint').toContain('npm run lint')
    expect(source, 'ci.yml lint job must run npm run type-check').toContain('npm run type-check')
  })

  it('🟢 ci.yml defines a test job that runs npm test', () => {
    const source = readFileSync(CI_YML, 'utf-8')
    expect(
      source,
      'ci.yml test job must run npm test'
    ).toContain('npm test')
  })

  it('🟢 ci.yml defines a build job that runs npm run build', () => {
    const source = readFileSync(CI_YML, 'utf-8')
    expect(
      source,
      'ci.yml build job must run npm run build'
    ).toContain('npm run build')
  })
})

// ─────────────────────────────────────────────────────────
// DEPLOY WORKFLOW                                        🟢
// ─────────────────────────────────────────────────────────
describe('Deploy Workflow (.github/workflows/deploy.yml)', () => {
  const DEPLOY_YML = join(ROOT, '.github', 'workflows', 'deploy.yml')

  it('🟢 .github/workflows/deploy.yml file exists', () => {
    expect(
      existsSync(DEPLOY_YML),
      '.github/workflows/deploy.yml is missing — Vercel deployment not configured'
    ).toBe(true)
  })

  it('🟢 deploy.yml triggers on pull_request (preview deploys)', () => {
    const source = readFileSync(DEPLOY_YML, 'utf-8')
    expect(
      source,
      'deploy.yml must trigger on pull_request for preview deployments'
    ).toContain('pull_request')
  })

  it('🟢 deploy.yml references VERCEL_TOKEN secret', () => {
    const source = readFileSync(DEPLOY_YML, 'utf-8')
    expect(
      source,
      'deploy.yml must reference secrets.VERCEL_TOKEN for authenticated deployments'
    ).toContain('VERCEL_TOKEN')
  })

  it('🟢 deploy.yml uses vercel deploy --prebuilt', () => {
    const source = readFileSync(DEPLOY_YML, 'utf-8')
    expect(
      source,
      'deploy.yml must use "vercel deploy --prebuilt" for efficient deployments'
    ).toContain('vercel deploy --prebuilt')
  })
})

// ─────────────────────────────────────────────────────────
// VERCEL CONFIG                                          🟢
// ─────────────────────────────────────────────────────────
describe('Vercel Configuration (vercel.json)', () => {
  const VERCEL_JSON = join(ROOT, 'vercel.json')

  it('🟢 vercel.json exists', () => {
    expect(
      existsSync(VERCEL_JSON),
      'vercel.json is missing — Vercel deployment configuration required'
    ).toBe(true)
  })

  it('🟢 vercel.json sets framework to nextjs', () => {
    const config = JSON.parse(readFileSync(VERCEL_JSON, 'utf-8'))
    expect(
      config.framework,
      'vercel.json must set "framework": "nextjs"'
    ).toBe('nextjs')
  })
})

// ─────────────────────────────────────────────────────────
// CI-REQUIRED PACKAGE.JSON SCRIPTS                      🟢
// ─────────────────────────────────────────────────────────
describe('CI-Required package.json Scripts', () => {
  it('🟢 lint script exists', () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'))
    expect(
      pkg.scripts?.lint,
      'lint script missing from package.json — ci.yml requires npm run lint'
    ).toBeDefined()
  })

  it('🟢 type-check script exists', () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'))
    expect(
      pkg.scripts?.['type-check'],
      'type-check script missing from package.json — ci.yml requires npm run type-check'
    ).toBeDefined()
  })

  it('🟢 test script exists', () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'))
    expect(
      pkg.scripts?.test,
      'test script missing from package.json — ci.yml requires npm test'
    ).toBeDefined()
  })

  it('🟢 build script exists', () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'))
    expect(
      pkg.scripts?.build,
      'build script missing from package.json — ci.yml requires npm run build'
    ).toBeDefined()
  })
})

// ─────────────────────────────────────────────────────────
// SECURITY: .env.local.example must use placeholders      🔴
// ─────────────────────────────────────────────────────────
describe('Security: .env.local.example credentials', () => {
  const ENV_EXAMPLE = join(ROOT, '.env.local.example')

  it('🔴 .env.local.example does not contain real JWT tokens (eyJ...)', () => {
    const source = readFileSync(ENV_EXAMPLE, 'utf-8')
    expect(
      source,
      '.env.local.example contains a real JWT token (starts with eyJ). Replace with placeholder like "your-supabase-anon-key"'
    ).not.toMatch(/=eyJ/)
  })

  it('🔴 .env.local.example does not contain a real Resend API key (re_...)', () => {
    const source = readFileSync(ENV_EXAMPLE, 'utf-8')
    expect(
      source,
      '.env.local.example contains a real Resend API key (re_...). Replace with placeholder like "re_your_resend_api_key"'
    ).not.toMatch(/=re_[A-Za-z0-9_]{10,}/)
  })
})
